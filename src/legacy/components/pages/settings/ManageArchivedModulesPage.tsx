import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Module, Assessment, ModuleStatus, AcademicTerm } from '../../../types';
import DeletionBlockedModal from '../../details/DeletionBlockedModal';
import ConfirmDeleteModal from '../../details/ConfirmDeleteModal';
import Toast from '../../Toast';
import { Icon } from '../../ui/Icon';

interface Props {
    allModules: Module[];
    allAssessments: Assessment[];
    allTerms: AcademicTerm[];
    onUpdateModule: (module: Module, originalModuleCode?: string) => Promise<void>;
    onDeleteModule: (moduleCode: string) => Promise<void>;
}

const statusStyles: Record<ModuleStatus, string> = {
  'In Progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  'Completed': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  'Dropped': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  'Planned': 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
  'Archived': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

const ManageArchivedModulesPage: React.FC<Props> = ({ allModules, allAssessments, allTerms, onUpdateModule, onDeleteModule }) => {
    const [activeFilter, setActiveFilter] = useState<'Active' | 'Archived'>('Active');
    const [searchTerm, setSearchTerm] = useState('');
    const [menuOpenForModule, setMenuOpenForModule] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // --- Deletion State ---
    const [moduleToDelete, setModuleToDelete] = useState<Module | null>(null);
    const [deletionBlocker, setDeletionBlocker] = useState<{ title: string; message: React.ReactNode } | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletionHasGradedWork, setDeletionHasGradedWork] = useState(false);
    
    // --- Toast State ---
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpenForModule(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const termMap = useMemo(() => new Map(allTerms.map(t => [t.id, t])), [allTerms]);

    const filteredModules = useMemo(() => {
        const lowercasedSearch = searchTerm.toLowerCase();
        return allModules
            .filter(m => {
                const matchesFilter = activeFilter === 'Active' ? m.status !== 'Archived' : m.status === 'Archived';
                const matchesSearch = lowercasedSearch === '' || 
                                      m.moduleCode.toLowerCase().includes(lowercasedSearch) ||
                                      m.moduleName.toLowerCase().includes(lowercasedSearch);
                return matchesFilter && matchesSearch;
            })
            .sort((a, b) => a.moduleCode.localeCompare(b.moduleCode));
    }, [allModules, activeFilter, searchTerm]);

    const handleUnarchive = async (moduleToUnarchive: Module) => {
        const updatedModule = { ...moduleToUnarchive, status: 'In Progress' as ModuleStatus };
        await onUpdateModule(updatedModule, moduleToUnarchive.moduleCode);
        setToastMessage(`Module ${moduleToUnarchive.moduleCode} has been restored.`);
        setMenuOpenForModule(null);
    };

    const handleDeleteAttempt = useCallback((module: Module) => {
        setMenuOpenForModule(null);
        setModuleToDelete(module);
        setDeletionBlocker(null);
        setDeletionHasGradedWork(false);

        const dependents = allModules.filter(m => m.offeringId !== module.offeringId && m.status !== 'Archived' && m.prerequisites?.includes(module.moduleCode));
        if (dependents.length > 0) {
            setDeletionBlocker({
                title: 'Deletion Blocked',
                message: <><p>This module is a prerequisite for active modules:</p><ul className="list-disc pl-5 mt-2 text-sm">{dependents.map(d => <li key={d.offeringId}>{d.moduleCode}</li>)}</ul></>,
            });
            return;
        }

        const moduleAssessments = allAssessments.filter(a => a.moduleCode === module.moduleCode);
        const hasGraded = moduleAssessments.some(a => a.status === 'Graded' || (a.result !== undefined && a.result !== null));
        if (hasGraded) {
            setDeletionHasGradedWork(true);
        }

        setIsDeleteModalOpen(true);
    }, [allModules, allAssessments]);

    const handleConfirmDelete = useCallback(async () => {
        if (!moduleToDelete) return;
        await onDeleteModule(moduleToDelete.moduleCode);
        setIsDeleteModalOpen(false);
        setModuleToDelete(null);
        // Toast is handled by App.tsx for deletions
    }, [moduleToDelete, onDeleteModule]);

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Manage Modules</h2>
            
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mt-6">
                <div className="flex p-1 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm font-medium">
                    <button onClick={() => setActiveFilter('Active')} className={`px-3 py-1 rounded-md transition-colors ${activeFilter === 'Active' ? 'bg-white dark:bg-slate-900 shadow text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'}`}>Active</button>
                    <button onClick={() => setActiveFilter('Archived')} className={`px-3 py-1 rounded-md transition-colors ${activeFilter === 'Archived' ? 'bg-white dark:bg-slate-900 shadow text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'}`}>Archived</button>
                </div>
                <div className="relative">
                    <input type="text" placeholder="Search modules..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full sm:w-64 pl-10 pr-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500" />
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"><Icon name="Search" className="w-5 h-5 text-slate-400" strokeWidth={2} /></div>
                </div>
            </div>

            <div className="mt-4 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                    {filteredModules.length > 0 ? filteredModules.map(mod => (
                        <div key={mod.offeringId} className="p-4 flex justify-between items-center">
                            <div>
                                <p className="font-bold text-slate-800 dark:text-slate-200">{mod.moduleCode}: {mod.moduleName}</p>
                                <div className="flex items-center gap-2 text-xs mt-1">
                                    <span className={`px-2 py-0.5 rounded-full ${statusStyles[mod.status]}`}>{mod.status}</span>
                                    <span className="text-slate-500 dark:text-slate-400">{termMap.get(mod.anchorTermId)?.termName || 'Unknown Term'}</span>
                                </div>
                            </div>
                            {activeFilter === 'Archived' && (
                                <div className="relative">
                                    <button onClick={() => setMenuOpenForModule(mod.offeringId)} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full" aria-label={`Actions for ${mod.moduleCode}`}>
                                        <Icon name="MoreVertical" className="w-5 h-5" strokeWidth={1.5} />
                                    </button>
                                    {menuOpenForModule === mod.offeringId && (
                                        <div ref={menuRef} className="absolute right-0 mt-1 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                                            <button onClick={() => handleUnarchive(mod)} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">Unarchive</button>
                                            <button onClick={() => handleDeleteAttempt(mod)} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/50">Delete Permanently</button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )) : (
                        <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                            No {activeFilter.toLowerCase()} modules found.
                        </div>
                    )}
                </div>
            </div>

            {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
            {deletionBlocker && <DeletionBlockedModal title={deletionBlocker.title} onDismiss={() => setDeletionBlocker(null)} onArchive={() => { setDeletionBlocker(null); if (moduleToDelete) handleUnarchive(moduleToDelete); }}>{deletionBlocker.message}</DeletionBlockedModal>}
            {isDeleteModalOpen && moduleToDelete && <ConfirmDeleteModal module={moduleToDelete} onConfirm={handleConfirmDelete} onDismiss={() => setIsDeleteModalOpen(false)} hasGradedWork={deletionHasGradedWork} assessmentCount={allAssessments.filter(a => a.moduleCode === moduleToDelete.moduleCode).length} />}
        </div>
    );
};

export default ManageArchivedModulesPage;