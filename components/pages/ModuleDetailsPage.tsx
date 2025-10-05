import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Module, Assessment, AcademicTerm, ModuleStatus } from '../../types';
import ModuleHeader from '../details/ModuleHeader';
import VitalSignsPanel from '../details/VitalSignsPanel';
import AssignmentsPanel from '../details/AssignmentsPanel';
import EditModuleDrawer from '../details/EditModuleDrawer.tsx';
import Toast from '../Toast';
import DeletionBlockedModal from '../details/DeletionBlockedModal';
import ConfirmDeleteModal from '../details/ConfirmDeleteModal';

interface Props {
  module: Module;
  moduleAssessments: Assessment[];
  allAssessments: Assessment[];
  allModules: Module[];
  allTerms: AcademicTerm[];
  onBack: () => void;
  onUpdateModule: (module: Module, originalModuleCode?: string) => Promise<void>;
  onDeleteModule: (moduleCode: string) => Promise<void>;
}

const ModuleDetailsPage: React.FC<Props> = ({ module, moduleAssessments, allAssessments, allModules, allTerms, onBack, onUpdateModule, onDeleteModule }) => {
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletionBlocker, setDeletionBlocker] = useState<{ title: string; message: React.ReactNode } | null>(null);
  const [deletionHasGradedWork, setDeletionHasGradedWork] = useState(false);
  
  // --- State for Undo and Highlighting ---
  const [undoState, setUndoState] = useState<{ previousModule: Module, currentModule: Module } | null>(null);
  const [showUndoToast, setShowUndoToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [highlightedFields, setHighlightedFields] = useState<Set<string>>(new Set());
  const toastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    // Clear timer on unmount
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);
  
  const handleUpdate = useCallback(async (updatedModule: Module, originalModule: Module, successMessage: string) => {
    // 1. Store state for potential undo
    setUndoState({ previousModule: originalModule, currentModule: updatedModule });
    
    // 2. Perform the update
    await onUpdateModule(updatedModule, originalModule.moduleCode);
    
    // 3. Show toast and set timers
    setToastMessage(successMessage);
    setShowUndoToast(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setShowUndoToast(false), 5000);

    // 4. Determine and set highlighted fields
    const changes = new Set<string>();
    (Object.keys(updatedModule) as Array<keyof Module>).forEach(key => {
        if (JSON.stringify(originalModule[key]) !== JSON.stringify(updatedModule[key])) {
            changes.add(key);
        }
    });
    setHighlightedFields(changes);
    setTimeout(() => setHighlightedFields(new Set()), 2000); // Highlight duration
  }, [onUpdateModule]);

  const handleSaveModule = async (updatedModule: Module) => {
    setIsEditDrawerOpen(false);
    await handleUpdate(updatedModule, module, 'Module saved successfully.');
  };

  const handleConfirmArchive = async () => {
    setIsArchiveModalOpen(false);
    const archivedModule = { ...module, status: 'Archived' as ModuleStatus };
    await handleUpdate(archivedModule, module, 'Module archived.');
  };

  const handleUndo = useCallback(async () => {
    if (!undoState) return;

    // Use the stored previous state to revert the change
    await onUpdateModule(undoState.previousModule, undoState.currentModule.moduleCode);
    
    // Clean up undo state
    setShowUndoToast(false);
    setUndoState(null);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  }, [undoState, onUpdateModule]);

  const handleDeleteAttempt = useCallback(() => {
    // Reset blockers
    setDeletionBlocker(null);
    setDeletionHasGradedWork(false);

    // Hard Block Check: Prerequisite for other modules
    const dependents = allModules.filter(
      // FIX: Property 'id' does not exist on type 'Module'. Use 'offeringId' to uniquely identify a module offering.
      (m) => m.offeringId !== module.offeringId && m.status !== 'Archived' && m.prerequisites?.includes(module.moduleCode)
    );
    if (dependents.length > 0) {
      setDeletionBlocker({
        title: 'Deletion Blocked',
        message: (
          <>
            <p>This module is a prerequisite for the following active modules and cannot be deleted:</p>
            <ul className="list-disc pl-5 mt-2 text-sm text-slate-500 dark:text-slate-400">
              {dependents.map((d) => (
                // FIX: Property 'id' does not exist on type 'Module'. Use 'offeringId' as the key.
                <li key={d.offeringId}>
                  {d.moduleCode}: {d.moduleName}
                </li>
              ))}
            </ul>
          </>
        ),
      });
      return;
    }
    
    // Soft Warning Check: Graded assessments
    const hasGraded = moduleAssessments.some(
      (a) => a.status === 'Graded' || (a.result !== undefined && a.result !== null)
    );
    if (hasGraded) {
      setDeletionHasGradedWork(true);
    }

    // If all hard checks pass, open the final confirmation modal
    setIsDeleteModalOpen(true);
  }, [moduleAssessments, allModules, module]);

  const handleConfirmDelete = useCallback(async () => {
      setIsDeleteModalOpen(false);
      await onDeleteModule(module.moduleCode);
      // The App component will handle navigation and toast
  }, [module, onDeleteModule]);


  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <ModuleHeader 
          module={module} 
          onBack={onBack} 
          onEdit={() => setIsEditDrawerOpen(true)}
          onArchive={() => setIsArchiveModalOpen(true)}
          onDelete={handleDeleteAttempt} 
          highlightedFields={highlightedFields}
        />
        
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
          {/* Left Column: Assignments (takes up 2/3 of the width on large screens) */}
          <div className="lg:col-span-2">
            <AssignmentsPanel assessments={moduleAssessments} />
          </div>

          {/* Right Column: Vitals (takes up 1/3 of the width and is sticky) */}
          <div className="lg:col-span-1">
             <div className="lg:sticky lg:top-6">
                <VitalSignsPanel module={module} highlightedFields={highlightedFields} />
            </div>
          </div>
        </main>
      </div>

      <EditModuleDrawer
        module={module}
        isOpen={isEditDrawerOpen}
        onClose={() => setIsEditDrawerOpen(false)}
        onSave={handleSaveModule}
        allModules={allModules}
        allTerms={allTerms}
        allAssessments={allAssessments}
      />

      {isArchiveModalOpen && (
        <ArchiveConfirmationModal
          module={module}
          onConfirm={handleConfirmArchive}
          onDismiss={() => setIsArchiveModalOpen(false)}
        />
      )}
      
      {deletionBlocker && (
        <DeletionBlockedModal
            title={deletionBlocker.title}
            onDismiss={() => setDeletionBlocker(null)}
            onArchive={() => {
                setDeletionBlocker(null);
                setIsArchiveModalOpen(true);
            }}
        >
            {deletionBlocker.message}
        </DeletionBlockedModal>
      )}

      {isDeleteModalOpen && (
          <ConfirmDeleteModal
              module={module}
              onConfirm={handleConfirmDelete}
              onDismiss={() => setIsDeleteModalOpen(false)}
              hasGradedWork={deletionHasGradedWork}
              assessmentCount={moduleAssessments.length}
          />
      )}

      {showUndoToast && (
        <Toast 
          message={toastMessage}
          onUndo={handleUndo}
          onClose={() => setShowUndoToast(false)}
        />
      )}
    </div>
  );
};

const ArchiveConfirmationModal: React.FC<{
  module: Module;
  onConfirm: () => void;
  onDismiss: () => void;
}> = ({ module, onConfirm, onDismiss }) => (
  <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-8 shadow-xl max-w-lg w-full animate-slide-up">
          <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-slate-100">Archive Module?</h2>
          <p className="text-slate-600 dark:text-slate-300 mb-6">
              Archive module <strong>{module.moduleCode}: {module.moduleName}</strong>?
              This removes it from dashboards and capacity calculations but keeps all associated data.
          </p>
          <div className="flex justify-end space-x-4">
              <button onClick={onDismiss} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600">Cancel</button>
              <button onClick={onConfirm} className="px-4 py-2 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700">Archive</button>
          </div>
      </div>
  </div>
);


export default ModuleDetailsPage;