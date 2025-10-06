import React, { useState, useEffect, useMemo, ChangeEvent } from 'react';
import { Module, ModuleStatus, ModuleType, AcademicTerm, Assessment } from '../../types';
import { calculateModuleMetrics } from '../../services/analytics';
import { NotAvailable } from '../../utils/uiHelpers';
import TermSelector from '../common/TermSelector';
import { Icon } from '../ui/Icon';

interface Props {
  module?: Module;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedModule: Module) => Promise<void>;
  allModules: Module[];
  allTerms: AcademicTerm[];
  allAssessments: Assessment[];
  activeTermId?: string | null;
}

const getGoalAlignmentStatus = (mod: Module): { text: string; color: string } | null => {
    const { calculated_current_grade, targetFinalGrade, minFinalGrade } = mod;
    if (calculated_current_grade === undefined || calculated_current_grade === null) return null;
    if (calculated_current_grade >= targetFinalGrade) return { text: 'On Track', color: 'text-green-600 dark:text-green-400' };
    if (calculated_current_grade >= (minFinalGrade ?? 50)) return { text: 'Needs Attention', color: 'text-yellow-600 dark:text-yellow-400' };
    return { text: 'At Risk', color: 'text-red-600 dark:text-red-500' };
};

interface LivePreviewStats {
    weeklyGoal: number;
    alignment: { text: string; color: string } | null;
    termName: string;
}

const EditModuleDrawer: React.FC<Props> = ({ module, isOpen, onClose, onSave, allModules, allTerms, allAssessments, activeTermId }) => {
  const isEditMode = !!module;
  
  const initialNewModule = useMemo((): Module => ({
      // FIX: Object literal may only specify known properties, and 'id' does not exist in type 'Module'. Replaced with 'offeringId' and 'moduleId'.
      offeringId: `offering-${Date.now()}`,
      moduleId: `mod-${Date.now()}`,
      moduleCode: '',
      moduleName: '',
      credits: 0,
      moduleType: 'Core',
      // FIX: Property 'termId' does not exist on type 'Module'. Use 'anchorTermId' instead.
      anchorTermId: activeTermId || allTerms.find(t => !t.parentTermId)?.id || allTerms[0]?.id || '',
      status: 'Planned',
      minFinalGrade: 50,
      targetFinalGrade: 75,
      minExamEntrance: undefined,
      minExamGrade: undefined,
      notes: '',
      prerequisites: [],
      startDate: undefined,
      endDate: undefined,
  }), [allTerms, activeTermId]);

  const [editedModule, setEditedModule] = useState<Module>(module || initialNewModule);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [moduleCodeConfirm, setModuleCodeConfirm] = useState(module?.moduleCode || '');
  const [termChangeModalState, setTermChangeModalState] = useState<{isOpen: boolean, newTermId: string | null}>({isOpen: false, newTermId: null});
  const [livePreviewStats, setLivePreviewStats] = useState<LivePreviewStats | null>(null);

  const isModuleCodeChanged = useMemo(() => isEditMode && module.moduleCode !== editedModule.moduleCode, [module, editedModule.moduleCode, isEditMode]);
  
  const moduleAssessments = useMemo(() => isEditMode ? allAssessments.filter(a => a.moduleCode === module.moduleCode) : [], [allAssessments, module, isEditMode]);

  useEffect(() => {
    if (isOpen) {
      const initialState = module || initialNewModule;
      setEditedModule(initialState);
      setModuleCodeConfirm(initialState.moduleCode);
      setErrors({});
    }
  }, [isOpen, module, initialNewModule]);
  
  const isDirty = useMemo(() => JSON.stringify(isEditMode ? module : initialNewModule) !== JSON.stringify(editedModule), [module, editedModule, isEditMode, initialNewModule]);
  
  // Live Preview Calculation
  useEffect(() => {
    // Recalculate module metrics with the edited data in memory
    const tempMetrics = calculateModuleMetrics(editedModule, moduleAssessments);
    const moduleWithTempMetrics = { ...editedModule, ...tempMetrics };

    const weeklyGoal = editedModule.credits * 1.5; // Heuristic for now
    const alignment = getGoalAlignmentStatus(moduleWithTempMetrics);
    // FIX: Property 'termId' does not exist on type 'Module'. Use 'anchorTermId' instead.
    const term = allTerms.find(t => t.id === editedModule.anchorTermId);
    const termName = term ? `${term.termName} (${term.academicYear})` : 'Unknown Term';

    setLivePreviewStats({ weeklyGoal, alignment, termName });
  }, [editedModule, moduleAssessments, allTerms]);

  // Validation Effect
  useEffect(() => {
      const validate = (mod: Module) => {
          const newErrors: Record<string, string> = {};
          if (!mod.moduleName.trim()) newErrors.moduleName = 'Module Name is required.';
          
          const trimmedCode = mod.moduleCode.trim();
          if (!trimmedCode) {
              newErrors.moduleCode = 'Module Code is required.';
          } else {
              const isDuplicate = allModules.some(m => 
                  // FIX: Property 'id' does not exist on type 'Module'. Use 'offeringId' to uniquely identify a module offering.
                  m.moduleCode.toLowerCase() === trimmedCode.toLowerCase() && m.offeringId !== mod.offeringId
              );
              if (isDuplicate) {
                  newErrors.moduleCode = 'A module with this code already exists.';
              }
          }

          if (isEditMode && isModuleCodeChanged && mod.moduleCode !== moduleCodeConfirm) {
              newErrors.moduleCodeConfirm = 'The confirmation code does not match.';
          }

          if (mod.credits <= 0) newErrors.credits = 'Credits must be a positive number.';
          if (mod.targetFinalGrade < 0 || mod.targetFinalGrade > 100) newErrors.targetFinalGrade = 'Must be between 0 and 100.';
          if (mod.minFinalGrade < 0 || mod.minFinalGrade > 100) newErrors.minFinalGrade = 'Must be between 0 and 100.';
          if (mod.minExamEntrance && (mod.minExamEntrance < 0 || mod.minExamEntrance > 100)) newErrors.minExamEntrance = 'Must be between 0 and 100.';
          if (mod.minExamGrade && (mod.minExamGrade < 0 || mod.minExamGrade > 100)) newErrors.minExamGrade = 'Must be between 0 and 100.';
          
          setErrors(newErrors);
      };
      validate(editedModule);
  }, [editedModule, moduleCodeConfirm, isModuleCodeChanged, allModules, isEditMode]);

  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let parsedValue: string | number | undefined = value;
    
    if (type === 'number') {
        parsedValue = value === '' ? undefined : parseFloat(value);
    }
    
    setEditedModule(prev => ({...prev, [name]: parsedValue }));
  };
  
  const handlePrereqChange = (e: ChangeEvent<HTMLInputElement>) => {
      const { value } = e.target;
      const prereqs = value.split(',').map(p => p.trim().toUpperCase()).filter(Boolean);
      setEditedModule(prev => ({ ...prev, prerequisites: prereqs }));
  };

  const handleTermChange = (newTermId: string) => {
      // FIX: Property 'termId' does not exist on type 'Module'. Use 'anchorTermId' instead.
      if (isEditMode && newTermId !== editedModule.anchorTermId) {
          setTermChangeModalState({isOpen: true, newTermId});
      } else {
          setEditedModule(prev => ({...prev, anchorTermId: newTermId}));
      }
  };

  const confirmTermChange = () => {
      if (termChangeModalState.newTermId) {
          setEditedModule(prev => ({...prev, anchorTermId: termChangeModalState.newTermId!}));
      }
      setTermChangeModalState({isOpen: false, newTermId: null});
  }

  const handleClose = () => {
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  const handleDiscard = () => {
    setShowDiscardConfirm(false);
    onClose();
  };

  const handleSave = async () => {
    if (!isDirty || !isValid) return;
    await onSave(editedModule);
  };

  const drawerClasses = isOpen ? 'translate-x-0' : 'translate-x-full';
  const overlayClasses = isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none';

  return (
    <div
      className={`fixed inset-0 z-40 transition-opacity ${overlayClasses}`}
      aria-labelledby="slide-over-title"
      role="dialog"
      aria-modal="true"
      onClick={handleClose}
    >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-50" aria-hidden="true" />

      <div className="absolute inset-0 overflow-hidden">
        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full sm:pl-10">
          <div className={`pointer-events-auto w-screen max-w-md transform transition ease-in-out duration-300 ${drawerClasses}`} onClick={(e) => e.stopPropagation()}>
            <div className="flex h-full flex-col overflow-y-scroll bg-white dark:bg-slate-800 shadow-xl">
              {/* Header */}
              <header className="bg-slate-50 dark:bg-slate-900 px-4 py-4 sm:px-6 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-start justify-between">
                  <h2 className="text-lg font-semibold leading-6 text-slate-900 dark:text-slate-100" id="slide-over-title">
                    {isEditMode ? 'Edit Module' : 'Add New Module'}
                  </h2>
                  <div className="ml-3 flex h-7 items-center">
                    <button
                      type="button"
                      className="rounded-md bg-transparent text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onClick={handleClose}
                    >
                      <span className="sr-only">Close panel</span>
                      <Icon name="X" className="h-6 w-6" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {isEditMode ? editedModule.moduleCode : 'Create a new module for your academic profile.'}
                </p>
              </header>
              {/* Body */}
              <div className="flex-1 px-4 py-6 sm:px-6 space-y-6">
                {/* Module Code */}
                <div>
                  <label htmlFor="moduleCode" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Module Code *
                  </label>
                  <input
                    type="text"
                    id="moduleCode"
                    name="moduleCode"
                    value={editedModule.moduleCode}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
                    placeholder="e.g., COS101"
                  />
                  {errors.moduleCode && <p className="mt-1 text-sm text-red-600">{errors.moduleCode}</p>}
                </div>

                {/* Module Code Confirmation (if changed in edit mode) */}
                {isEditMode && isModuleCodeChanged && (
                  <div>
                    <label htmlFor="moduleCodeConfirm" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Confirm Module Code *
                    </label>
                    <input
                      type="text"
                      id="moduleCodeConfirm"
                      value={moduleCodeConfirm}
                      onChange={(e) => setModuleCodeConfirm(e.target.value)}
                      className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
                      placeholder="Re-enter the module code"
                    />
                    {errors.moduleCodeConfirm && <p className="mt-1 text-sm text-red-600">{errors.moduleCodeConfirm}</p>}
                  </div>
                )}

                {/* Module Name */}
                <div>
                  <label htmlFor="moduleName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Module Name *
                  </label>
                  <input
                    type="text"
                    id="moduleName"
                    name="moduleName"
                    value={editedModule.moduleName}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
                    placeholder="e.g., Introduction to Programming"
                  />
                  {errors.moduleName && <p className="mt-1 text-sm text-red-600">{errors.moduleName}</p>}
                </div>

                {/* Credits */}
                <div>
                  <label htmlFor="credits" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Credits *
                  </label>
                  <input
                    type="number"
                    id="credits"
                    name="credits"
                    value={editedModule.credits || ''}
                    onChange={handleChange}
                    min="1"
                    className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
                  />
                  {errors.credits && <p className="mt-1 text-sm text-red-600">{errors.credits}</p>}
                </div>

                {/* Module Type */}
                <div>
                  <label htmlFor="moduleType" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Type *
                  </label>
                  <select
                    id="moduleType"
                    name="moduleType"
                    value={editedModule.moduleType}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
                  >
                    <option value="Core">Core</option>
                    <option value="Elective">Elective</option>
                  </select>
                </div>

                {/* Target Final Grade (Goal) */}
                <div>
                  <label htmlFor="targetFinalGrade" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Goal (Target Final Grade) *
                  </label>
                  <input
                    type="number"
                    id="targetFinalGrade"
                    name="targetFinalGrade"
                    value={editedModule.targetFinalGrade}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
                  />
                  {errors.targetFinalGrade && <p className="mt-1 text-sm text-red-600">{errors.targetFinalGrade}</p>}
                </div>

                {/* Min Final Grade */}
                <div>
                  <label htmlFor="minFinalGrade" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Minimum Final Grade *
                  </label>
                  <input
                    type="number"
                    id="minFinalGrade"
                    name="minFinalGrade"
                    value={editedModule.minFinalGrade}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
                  />
                  {errors.minFinalGrade && <p className="mt-1 text-sm text-red-600">{errors.minFinalGrade}</p>}
                </div>

                {/* Min Exam Entrance */}
                <div>
                  <label htmlFor="minExamEntrance" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Minimum Exam Entrance Grade
                  </label>
                  <input
                    type="number"
                    id="minExamEntrance"
                    name="minExamEntrance"
                    value={editedModule.minExamEntrance || ''}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
                  />
                  {errors.minExamEntrance && <p className="mt-1 text-sm text-red-600">{errors.minExamEntrance}</p>}
                </div>

                {/* Min Exam Grade */}
                <div>
                  <label htmlFor="minExamGrade" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Minimum Exam Grade
                  </label>
                  <input
                    type="number"
                    id="minExamGrade"
                    name="minExamGrade"
                    value={editedModule.minExamGrade || ''}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
                  />
                  {errors.minExamGrade && <p className="mt-1 text-sm text-red-600">{errors.minExamGrade}</p>}
                </div>

                {/* Prerequisites */}
                <div>
                  <label htmlFor="prerequisites" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Prerequisites
                  </label>
                  <select
                    id="prerequisites"
                    name="prerequisites"
                    multiple
                    value={editedModule.prerequisites}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                      const selected = Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => option.value);
                      setEditedModule(prev => ({ ...prev, prerequisites: selected }));
                    }}
                    className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
                  >
                    {allModules.filter(m => m.offeringId !== editedModule.offeringId).map(m => (
                      <option key={m.moduleCode} value={m.moduleCode}>
                        {m.moduleCode}: {m.moduleName}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-sm text-slate-500">Hold Ctrl (Cmd on Mac) to select multiple.</p>
                </div>

                {/* Term */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Term *
                  </label>
                  <TermSelector
                    value={editedModule.anchorTermId}
                    onChange={handleTermChange}
                    allTerms={allTerms}
                    visibleTermTypes={['Year', 'Semester', 'Quarter']}
                    selectableTermTypes={['Year', 'Semester', 'Quarter']}
                    className="mt-1"
                  />
                </div>

                {/* Status */}
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Status *
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={editedModule.status}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
                  >
                    <option value="Planned">Planned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Dropped">Dropped</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>

                {/* Optional Start Date */}
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Start Date (Optional)
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={editedModule.startDate || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
                  />
                </div>

                {/* Optional End Date */}
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={editedModule.endDate || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={editedModule.notes || ''}
                    onChange={handleChange}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
                    placeholder="Additional notes..."
                  />
                </div>

                {/* Live Preview */}
                {livePreviewStats && (
                  <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Live Preview</h3>
                    <div className="space-y-1 text-sm">
                      <p>Weekly Goal: {livePreviewStats.weeklyGoal.toFixed(1)} hours</p>
                      <p>Term: {livePreviewStats.termName}</p>
                      {livePreviewStats.alignment && (
                        <p className={livePreviewStats.alignment.color}>Alignment: {livePreviewStats.alignment.text}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <footer className="bg-slate-50 dark:bg-slate-900 px-4 py-4 sm:px-6 border-t border-slate-200 dark:border-slate-700">
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={!isValid || !isDirty}
                    className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save
                  </button>
                </div>
              </footer>
            </div>
          </div>
        </div>
      </div>

      {/* Term Change Confirmation Modal */}
      {termChangeModalState.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-8 shadow-xl max-w-lg w-full animate-slide-up">
            <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-slate-100">Confirm Term Change</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Changing the term may affect assessments and calculations. Are you sure?
            </p>
            <div className="flex justify-end space-x-4">
              <button onClick={() => setTermChangeModalState({isOpen: false, newTermId: null})} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600">Cancel</button>
              <button onClick={confirmTermChange} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Discard Confirmation Modal */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-8 shadow-xl max-w-lg w-full animate-slide-up">
            <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-slate-100">Discard Changes?</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              You have unsaved changes. Are you sure you want to discard them?
            </p>
            <div className="flex justify-end space-x-4">
              <button onClick={() => setShowDiscardConfirm(false)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600">Keep Editing</button>
              <button onClick={handleDiscard} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700">Discard</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditModuleDrawer;
