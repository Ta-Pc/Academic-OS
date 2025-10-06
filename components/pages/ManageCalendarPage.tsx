import React, { useMemo, useState, useEffect } from 'react';
import { AcademicTerm } from '../../types';
import * as database from '../../services/database';
import AddYearModal from '../settings/AddYearModal';
import CalendarTimeline from '../settings/CalendarTimeline';
import TermFormModal from '../settings/TermFormModal';
import ConfirmTermDeleteModal from '../settings/ConfirmTermDeleteModal';
import ConfirmYearDeleteModal from '../settings/ConfirmYearDeleteModal';
import { Icon } from '../ui/Icon';

interface Props {
  onBack: () => void;
  onNext?: () => void;
  isSetupMode?: boolean;
  initialTermsData?: AcademicTerm[];
  onSaveSetupData?: (terms: AcademicTerm[]) => void;
  isEmbedded?: boolean; // New prop
}

const ManageCalendarPage: React.FC<Props> = ({ 
  onBack: onBackProp, 
  onNext, 
  isSetupMode = false, 
  initialTermsData = [],
  onSaveSetupData,
  isEmbedded = false // New prop with default
}) => {
  const [expandedYear, setExpandedYear] = useState<number | null>(null);
  const [allTerms, setAllTerms] = useState<AcademicTerm[]>([]);
  const [initialTerms, setInitialTerms] = useState<AcademicTerm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isDirty, setIsDirty] = useState(false);
  
  const [isAddYearModalOpen, setIsAddYearModalOpen] = useState(false);
  const [isTermFormModalOpen, setIsTermFormModalOpen] = useState(false);
  const [editingTermState, setEditingTermState] = useState<{ term: AcademicTerm | null; parentTerm: AcademicTerm | null; isSemester: boolean } | null>(null);
  const [termToDelete, setTermToDelete] = useState<AcademicTerm | null>(null);
  const [yearToDelete, setYearToDelete] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);

  useEffect(() => {
    if (toast) {
        const timer = setTimeout(() => setToast(null), 5000);
        return () => clearTimeout(timer);
    }
  }, [toast]);
  
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      if (isSetupMode) {
        const sorted = [...initialTermsData].sort((a,b) => a.startDate.localeCompare(b.startDate));
        setAllTerms(sorted);
        setInitialTerms(sorted);
        const years = [...new Set(sorted.map(t => t.academicYear))].sort((a, b) => a - b);
        if (years.length > 0) {
            setExpandedYear(years[0]);
        }
      } else {
        const termsFromDb = await database.getAllTerms();
        const sortedTerms = termsFromDb.sort((a,b) => a.startDate.localeCompare(b.startDate));
        setAllTerms(sortedTerms);
        setInitialTerms(sortedTerms);
      }
      setIsLoading(false);
    };
    loadData();
  }, [isSetupMode, initialTermsData]);

  const academicYears = useMemo(() => {
    return [...new Set(allTerms.map(t => t.academicYear))]
        .filter((y): y is number => y != null)
        .sort((a, b) => b - a);
  }, [allTerms]);

  useEffect(() => {
    const hasChanges = JSON.stringify(initialTerms) !== JSON.stringify(allTerms);
    setIsDirty(hasChanges);
  }, [allTerms, initialTerms]);
  
  const handleBack = () => {
      if (isDirty && !isSetupMode) {
          setShowUnsavedChangesModal(true);
      } else {
          onBackProp();
      }
  };

  const handleDiscardAndLeave = () => {
      setShowUnsavedChangesModal(false);
      setAllTerms(initialTerms); // Revert changes
      onBackProp();
  };

  const handleAddYear = (year: number) => {
    const newSem1: AcademicTerm = {
      id: `term-${Date.now()}-1`,
      academicYear: year,
      parentTermId: null,
      termName: `Semester 1`,
      startDate: `${year}-02-17`,
      durationInWeeks: 14,
      endDate: `${year}-05-30`,
      notionalHoursPerCredit: 10,
    };
    const newSem2: AcademicTerm = {
      id: `term-${Date.now()}-2`,
      academicYear: year,
      parentTermId: null,
      termName: `Semester 2`,
      startDate: `${year}-07-21`,
      durationInWeeks: 14,
      endDate: `${year}-11-07`,
      notionalHoursPerCredit: 10,
    };
    setAllTerms(prev => [...prev, newSem1, newSem2].sort((a,b) => a.startDate.localeCompare(b.startDate)));
    setIsAddYearModalOpen(false);
    setExpandedYear(year);
  };
  
  const handleOpenTermModal = (term: AcademicTerm | null, parentTerm: AcademicTerm | null, isSemester: boolean) => {
    setEditingTermState({ term, parentTerm, isSemester });
    setIsTermFormModalOpen(true);
  };

  const handleSaveTerm = (newTermData: AcademicTerm) => {
    setAllTerms(currentTerms => {
      const isEditing = currentTerms.some(t => t.id === newTermData.id);
      if (isEditing) {
        return currentTerms.map(t => t.id === newTermData.id ? newTermData : t);
      } else {
        return [...currentTerms, newTermData];
      }
    });
    setIsTermFormModalOpen(false);
    setEditingTermState(null);
  };

  const handleConfirmDeleteTerm = () => {
    if (!termToDelete) return;

    setAllTerms(currentTerms => {
      const termIdsToRemove = new Set<string>([termToDelete.id]);
      if (!termToDelete.parentTermId) { // It's a semester, remove children
          currentTerms.forEach(t => {
              if (t.parentTermId === termToDelete.id) termIdsToRemove.add(t.id);
          });
      }
      return currentTerms.filter(t => !termIdsToRemove.has(t.id));
    });

    setTermToDelete(null);
  };

  const handleDeleteYearAttempt = async (year: number) => {
    if (isSetupMode) {
      setYearToDelete(year);
      return;
    }
    const modulesInYear = await database.getModulesForYear(year);
    if (modulesInYear.length > 0) {
        setToast({
            message: `Cannot delete ${year}. It contains ${modulesInYear.length} module(s). Please move or delete them first.`,
            type: 'error'
        });
    } else {
        setYearToDelete(year);
    }
  };

  const handleConfirmYearDeletion = async () => {
      if (yearToDelete === null) return;

      if(isSetupMode) {
        setAllTerms(prev => prev.filter(t => t.academicYear !== yearToDelete));
        setYearToDelete(null);
        return;
      }

      try {
          await database.deleteAcademicYear(yearToDelete);
          setAllTerms(prev => prev.filter(t => t.academicYear !== yearToDelete));
          setToast({ message: `${yearToDelete} academic year has been deleted.`, type: 'success' });
      } catch (error) {
          console.error("Failed to delete year:", error);
          setToast({ message: `Error deleting ${yearToDelete}. Please try again.`, type: 'error' });
      } finally {
          setYearToDelete(null);
      }
  };


  const handleSaveChanges = async () => {
      if (isSetupMode) {
          onSaveSetupData?.(allTerms);
          onNext?.();
      } else {
          const createdOrUpdated = allTerms.filter(t => {
            const initial = initialTerms.find(it => it.id === t.id);
            return !initial || JSON.stringify(initial) !== JSON.stringify(t);
          });
          const deletedIds = initialTerms.filter(it => !allTerms.some(t => t.id === it.id)).map(t => t.id);

          await database.saveTermsBatch(createdOrUpdated, deletedIds);
          
          const termsFromDb = await database.getAllTerms();
          const sortedTerms = termsFromDb.sort((a,b) => a.startDate.localeCompare(b.startDate));
          setAllTerms(sortedTerms);
          setInitialTerms(sortedTerms);
          setExpandedYear(null);
          setIsDirty(false);
          setToast({ message: 'Calendar changes saved successfully.', type: 'success' });
      }
  };

  if (isLoading && !isEmbedded) {
    return <div className="min-h-screen flex items-center justify-center">Loading Calendar...</div>;
  }
  
  const mainContent = (
      <div className={isSetupMode || isEmbedded ? '' : 'max-w-4xl mx-auto p-4 sm:p-6 lg:p-8'}>
        <div className="flex justify-between items-center mb-6">
            <h2 className={`font-bold text-slate-800 dark:text-slate-200 ${isEmbedded ? 'text-2xl' : 'text-3xl'}`}>
                {isSetupMode ? 'Calendar Setup' : 'Manage Academic Calendar'}
            </h2>
            <button onClick={() => setIsAddYearModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 flex items-center gap-2">
            <Icon name="Plus" className="w-5 h-5" strokeWidth={2} />
            Add New Year
            </button>
        </div>

        <div className="space-y-4">
            {academicYears.length > 0 ? (
                academicYears.map(year => {
                    const isExpanded = expandedYear === year;
                    const termsForYear = allTerms.filter(t => t.academicYear === year);
                    const semesters = termsForYear.filter(t => !t.parentTermId).sort((a, b) => a.startDate.localeCompare(b.startDate));
                    const quartersBySemesterId = termsForYear.reduce((acc, term) => {
                        if (term.parentTermId) {
                            if (!acc[term.parentTermId]) acc[term.parentTermId] = [];
                            acc[term.parentTermId].push(term);
                        }
                        return acc;
                    }, {} as Record<string, AcademicTerm[]>);

                    return (
                        <div key={year} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-300">
                            <div className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                <div className="flex justify-between items-center">
                                    <button
                                        onClick={() => setExpandedYear(isExpanded ? null : year)}
                                        className="flex-1 text-left"
                                        aria-expanded={isExpanded}
                                    >
                                        <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{year}</span>
                                        <Icon name="ChevronDown" className={`w-5 h-5 text-slate-500 dark:text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} strokeWidth={2} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteYearAttempt(year)}
                                        className="text-slate-500 hover:text-red-600 dark:hover:text-red-500 transition-colors"
                                        aria-label={`Delete ${year} academic year`}
                                    >
                                        <Icon name="Trash2" className="w-5 h-5" strokeWidth={1.5} />
                                    </button>
                                </div>
                            </div>

                            {isExpanded && (
                                <div className="p-6 border-t border-slate-200 dark:border-slate-700 animate-fade-in">
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl shadow-inner mb-8">
                                        <CalendarTimeline year={year} terms={termsForYear} />
                                    </div>
                                    <div className="space-y-6">
                                        {semesters.map(semester => (
                                            <div key={semester.id} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                                            <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-700">
                                                <div>
                                                <h3 className="text-lg font-bold text-indigo-700 dark:text-indigo-400">{semester.termName}</h3>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">{semester.startDate} to {semester.endDate}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                <button onClick={() => handleOpenTermModal(semester, null, true)} className="text-sm font-medium text-blue-600 dark:text-blue-400">Edit</button>
                                                <button onClick={() => setTermToDelete(semester)} className="text-sm font-medium text-red-600 dark:text-red-400">Delete</button>
                                                </div>
                                            </div>
                                            <div className="pt-4 space-y-3">
                                                {(quartersBySemesterId[semester.id] || []).sort((a,b) => a.startDate.localeCompare(b.startDate)).map(quarter => (
                                                <div key={quarter.id} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg flex justify-between items-center">
                                                    <div>
                                                    <p className="font-semibold text-slate-700 dark:text-slate-300">{quarter.termName}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">{quarter.startDate} to {quarter.endDate}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                    <button onClick={() => handleOpenTermModal(quarter, semester, false)} className="text-xs font-medium text-blue-600 dark:text-blue-400">Edit</button>
                                                    <button onClick={() => setTermToDelete(quarter)} className="text-xs font-medium text-red-600 dark:text-red-400">Delete</button>
                                                    </div>
                                                </div>
                                                ))}
                                                <button onClick={() => handleOpenTermModal(null, semester, false)} className="w-full text-center py-2 text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/50 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900">
                                                    + Add Quarter
                                                </button>
                                            </div>
                                            </div>
                                        ))}
                                        <button onClick={() => handleOpenTermModal(null, null, true)} className="w-full py-3 text-lg font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-xl shadow-sm border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                            + Add Semester
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })
            ) : (
                <div className="text-center p-10 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">No Years Configured</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Click 'Add New Year' to set up your first academic calendar.</p>
                </div>
            )}
        </div>

        {(isSetupMode || (!isEmbedded && isDirty)) && (
            <div className="flex justify-between items-center pt-8 mt-8 border-t border-slate-200 dark:border-slate-700">
                <button onClick={handleBack} className="px-6 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600">
                    {isSetupMode ? 'Back' : 'Cancel'}
                </button>
                <button onClick={handleSaveChanges} disabled={!isSetupMode && !isDirty} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 disabled:bg-slate-400 disabled:cursor-not-allowed">
                    {isSetupMode ? 'Save & Continue' : 'Save All Changes'}
                </button>
            </div>
        )}
      </div>
  );

  return (
    <div className={isEmbedded ? 'p-6' : 'min-h-screen bg-slate-100 dark:bg-slate-900'}>
      {!isSetupMode && !isEmbedded && (
          <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:p-8 py-4">
              <button onClick={handleBack} className="text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-2">
                <Icon name="ChevronLeft" className="w-5 h-5" strokeWidth={2} />
                Back to Dashboard
              </button>
            </div>
          </header>
      )}

      {mainContent}

      {toast && (
        <div className={`fixed bottom-5 left-1/2 -translate-x-1/2 w-full max-w-md p-4 rounded-lg shadow-2xl z-50 animate-slide-up ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'} text-white`}>
            <p>{toast.message}</p>
        </div>
      )}

      <AddYearModal isOpen={isAddYearModalOpen} onClose={() => setIsAddYearModalOpen(false)} onAddYear={handleAddYear} existingYears={academicYears} />
      
      {isTermFormModalOpen && editingTermState && (
        <TermFormModal isOpen={isTermFormModalOpen} onClose={() => setIsTermFormModalOpen(false)} onSave={handleSaveTerm} year={expandedYear!} termToEdit={editingTermState.term} parentTerm={editingTermState.parentTerm} isSemester={editingTermState.isSemester} allTermsInYear={allTerms.filter(t => t.academicYear === expandedYear)} />
      )}
      
      {termToDelete && (
          <ConfirmTermDeleteModal term={termToDelete} onConfirm={handleConfirmDeleteTerm} onDismiss={() => setTermToDelete(null)} childCount={(allTerms.filter(t => t.parentTermId === termToDelete.id) || []).length} />
      )}

      {yearToDelete !== null && (
        <ConfirmYearDeleteModal
            year={yearToDelete}
            onConfirm={handleConfirmYearDeletion}
            onDismiss={() => setYearToDelete(null)}
        />
      )}

      {showUnsavedChangesModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-8 shadow-xl max-w-sm w-full">
              <h2 className="text-xl font-bold mb-4">Unsaved Changes</h2>
              <p className="text-slate-600 dark:text-slate-300 mb-6">You have unsaved changes. Are you sure you want to leave?</p>
              <div className="flex justify-end space-x-4">
                <button onClick={() => setShowUnsavedChangesModal(false)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg">Stay</button>
                <button onClick={handleDiscardAndLeave} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg">Discard & Leave</button>
              </div>
            </div>
          </div>
      )}
    </div>
  );
};

export default ManageCalendarPage;