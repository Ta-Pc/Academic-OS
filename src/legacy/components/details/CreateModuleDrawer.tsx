import React, { useState, useEffect, useMemo } from 'react';
import { Module, ModuleStatus, ModuleType, AcademicTerm } from '../../types';
import TermSelector from '../common/TermSelector';
import { Icon } from '../ui/Icon';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newModule: Module) => Promise<void>;
  allModules: Module[];
  allTerms: AcademicTerm[];
  activeTermId?: string | null;
}

const CreateModuleDrawer: React.FC<Props> = ({ isOpen, onClose, onSave, allModules, allTerms, activeTermId }) => {
  const initialNewModule = useMemo((): Module => ({
    offeringId: `offering-${Date.now()}`,
    moduleId: `mod-${Date.now()}`,
    moduleCode: '',
    moduleName: '',
    credits: 0,
    moduleType: 'Core',
    anchorTermId: activeTermId || allTerms.find(t => !t.parentTermId)?.id || allTerms[0]?.id || '',
    status: 'Planned',
    minFinalGrade: 50,
    targetFinalGrade: 75,
    notes: '',
    prerequisites: [],
  }), [allTerms, activeTermId]);

  const [newModule, setNewModule] = useState<Module>(initialNewModule);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNewModule(initialNewModule);
      setErrors({});
    }
  }, [isOpen, initialNewModule]);

  const isDirty = useMemo(() => JSON.stringify(initialNewModule) !== JSON.stringify(newModule), [newModule, initialNewModule]);

  // Validation Effect
  useEffect(() => {
    const validate = (mod: Module) => {
      const newErrors: Record<string, string> = {};
      if (!mod.moduleName.trim()) newErrors.moduleName = 'Module Name is required.';
      if (!mod.moduleCode.trim()) newErrors.moduleCode = 'Module Code is required.';
      else {
        const isDuplicate = allModules.some(m => m.moduleCode.toLowerCase() === mod.moduleCode.toLowerCase().trim());
        if (isDuplicate) newErrors.moduleCode = 'A module with this code already exists.';
      }
      if (mod.credits <= 0) newErrors.credits = 'Credits must be a positive number.';
      if (mod.targetFinalGrade < 0 || mod.targetFinalGrade > 100) newErrors.targetFinalGrade = 'Must be between 0 and 100.';
      if (mod.minFinalGrade < 0 || mod.minFinalGrade > 100) newErrors.minFinalGrade = 'Must be between 0 and 100.';
      if (mod.minExamEntrance && (mod.minExamEntrance < 0 || mod.minExamEntrance > 100)) newErrors.minExamEntrance = 'Must be between 0 and 100.';
      if (mod.minExamGrade && (mod.minExamGrade < 0 || mod.minExamGrade > 100)) newErrors.minExamGrade = 'Must be between 0 and 100.';
      setErrors(newErrors);
    };
    validate(newModule);
  }, [newModule, allModules]);

  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let parsedValue: string | number | undefined = value;

    if (type === 'number') {
      parsedValue = value === '' ? undefined : parseFloat(value);
    }

    setNewModule(prev => ({ ...prev, [name]: parsedValue }));
  };

  const handlePrereqChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const prereqs = value.split(',').map(p => p.trim().toUpperCase()).filter(Boolean);
    setNewModule(prev => ({ ...prev, prerequisites: prereqs }));
  };

  const handleTermChange = (newTermId: string) => {
    setNewModule(prev => ({ ...prev, anchorTermId: newTermId }));
  };

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
    await onSave(newModule);
  };

  const drawerClasses = isOpen ? 'translate-x-0' : 'translate-x-full';
  const overlayClasses = isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none';

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 transition-opacity ${overlayClasses}`}
        aria-labelledby="create-module-title"
        role="dialog"
        aria-modal="true"
        onClick={handleClose}
      />

      <div className="fixed inset-0 overflow-hidden z-50">
        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full sm:pl-10">
          <div className={`pointer-events-auto w-screen max-w-md transform transition ease-in-out duration-300 ${drawerClasses}`} onClick={(e) => e.stopPropagation()}>
            <div className="flex h-full flex-col overflow-y-scroll bg-white dark:bg-slate-800 shadow-xl">
              {/* Header */}
              <header className="bg-slate-50 dark:bg-slate-900 px-4 py-4 sm:px-6 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-start justify-between">
                  <h2 className="text-lg font-semibold leading-6 text-slate-900 dark:text-slate-100" id="create-module-title">
                    Add New Module
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
                  Create a new module for your academic profile.
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
                    value={newModule.moduleCode}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
                    placeholder="e.g., COS101"
                  />
                  {errors.moduleCode && <p className="mt-1 text-sm text-red-600">{errors.moduleCode}</p>}
                </div>

                {/* Module Name */}
                <div>
                  <label htmlFor="moduleName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Module Name *
                  </label>
                  <input
                    type="text"
                    id="moduleName"
                    name="moduleName"
                    value={newModule.moduleName}
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
                    value={newModule.credits || ''}
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
                    value={newModule.moduleType}
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
                    value={newModule.targetFinalGrade}
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
                    value={newModule.minFinalGrade}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
                  />
                  {errors.minFinalGrade && <p className="mt-1 text-sm text-red-600">{errors.minFinalGrade}</p>}
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
                    value={newModule.prerequisites}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                      const selected = Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => option.value);
                      setNewModule(prev => ({ ...prev, prerequisites: selected }));
                    }}
                    className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
                  >
                    {allModules.map(m => (
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
                    value={newModule.anchorTermId}
                    onChange={handleTermChange}
                    allTerms={allTerms}
                    visibleTermTypes={['Year', 'Semester', 'Quarter']}
                    selectableTermTypes={['Year', 'Semester', 'Quarter']}
                    className="mt-1"
                  />
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
                    value={newModule.startDate || ''}
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
                    value={newModule.endDate || ''}
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
                    value={newModule.notes || ''}
                    onChange={handleChange}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
                    placeholder="Additional notes..."
                  />
                </div>
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
                    Create
                  </button>
                </div>
              </footer>
            </div>
          </div>
        </div>
      </div>

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
    </>
  );
};

export default CreateModuleDrawer;
