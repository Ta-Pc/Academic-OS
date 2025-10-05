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
              {/* The closing tags for the header are missing, but assuming they are there and will add export at the end */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditModuleDrawer;
