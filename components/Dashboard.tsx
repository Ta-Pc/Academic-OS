import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { FormData, Module, Assessment, AcademicTerm, TermType } from '../types';
import { isWithinInterval, parseISO, startOfDay, addDays, startOfYear, endOfYear, format } from 'date-fns';
import PriorityActionsPane from './panes/PriorityActionsPane';
import DayOverloadPane from './panes/DayOverloadPane';
import ModuleTile from './ModuleTile';
import ModuleOverviewDialog from './ModuleOverviewDialog';
import GlobalHeader from './dashboard/GlobalHeader';
// FIX: Explicitly import from the .tsx file to resolve ambiguity with a similarly named .ts file.
import ModulesOverviewControls, { SortKey, Filters, StatusFilter, initialFilters, FilterMode } from './dashboard/ModulesOverviewControls.tsx';
import { getDashboardPreferences, setDashboardPreferences, DashboardPreferences } from '../utils/localStorage';
import CreateModuleDrawer from './details/CreateModuleDrawer.tsx';
import Toast from './Toast';
import { useTerm } from './contexts/TermContext';
import * as database from '../services/database';

// --- Helper Functions & Hooks ---

const getModuleStatusText = (module: Module): StatusFilter => {
    const { calculated_current_grade, targetFinalGrade, minFinalGrade } = module;
    if (calculated_current_grade === undefined || calculated_current_grade === null) return null;
    if (calculated_current_grade >= targetFinalGrade) return 'On Track';
    if (calculated_current_grade >= (minFinalGrade ?? 50)) return 'Needs Attention';
    return 'At Risk';
};

const usePersistentDashboardState = () => {
    const [prefs, setPrefs] = useState<Omit<DashboardPreferences, 'filterMode'>>(() => {
        const saved = getDashboardPreferences();
        return {
            sortKey: saved.sortKey || 'risk',
            filters: { ...initialFilters, ...(saved.filters || {}) },
            isCompact: saved.isCompact || false,
        };
    });

    useEffect(() => {
        setDashboardPreferences(prefs);
    }, [prefs]);
    
    const setSortKey = (sortKey: SortKey) => setPrefs(p => ({ ...p, sortKey }));
    const setFilters = (updater: React.SetStateAction<Filters>) => {
        setPrefs(p => ({...p, filters: typeof updater === 'function' ? updater(p.filters) : updater}));
    };
    const setIsCompact = (isCompact: boolean) => setPrefs(p => ({ ...p, isCompact }));

    return { ...prefs, setSortKey, setFilters, setIsCompact };
};

const getAllTermsWithYears = (terms: AcademicTerm[]): AcademicTerm[] => {
    const allTermsWithYears: AcademicTerm[] = [...terms];
    const years = [...new Set(terms.map(t => t.academicYear))];

    years.forEach(year => {
        if (!allTermsWithYears.some(t => t.id === `year-${year}`)) {
            const yearTerm: AcademicTerm = {
                id: `year-${year}`,
                academicYear: year,
                termName: `${year} Academic Year`,
                startDate: format(startOfYear(new Date(year, 0, 1)), 'yyyy-MM-dd'),
                endDate: format(endOfYear(new Date(year, 0, 1)), 'yyyy-MM-dd'),
                parentTermId: null,
                durationInWeeks: 52,
                notionalHoursPerCredit: 10,
            };
            allTermsWithYears.push(yearTerm);
        }
    });

    return allTermsWithYears;
};


// --- Main Dashboard Component ---

const Dashboard: React.FC<{ 
    formData: FormData; 
    onReset: () => void; 
    onModuleClick: (offeringId: string) => void;
    onNavigateToTermNavigator: () => void;
    onNavigateToSettings: (initialTab?: string) => void;
    onAddModule: (module: Module) => Promise<void>;
    toastMessage: string | null;
    onClearToast: () => void;
    filterMode: FilterMode;
}> = ({ formData, onReset, onModuleClick, onNavigateToTermNavigator, onNavigateToSettings, onAddModule, toastMessage, onClearToast, filterMode }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [selectedModule, setSelectedModule] = useState<Module | null>(null);
    const [isAddModuleDrawerOpen, setIsAddModuleDrawerOpen] = useState(false);
    const { sortKey, filters, isCompact, setSortKey, setFilters, setIsCompact } = usePersistentDashboardState();
    
    // Accessibility State
    const [announcement, setAnnouncement] = useState('');
    const [focusedTileIndex, setFocusedTileIndex] = useState<number | null>(null);
    const gridRef = useRef<HTMLDivElement>(null);
    const tileRefs = useRef<(HTMLButtonElement | null)[]>([]);

    const today = useMemo(() => startOfDay(new Date()), []);
    const { activeTermId } = useTerm();

    useEffect(() => {
        // Simulate initial data fetch for skeleton loaders
        const timer = setTimeout(() => setIsLoading(false), 1500);
        return () => clearTimeout(timer);
    }, []);

    const handleFilterChange = useCallback(<K extends keyof Filters>(filter: K, value: Filters[K]) => {
        setFilters(prev => {
            const newFilters = { ...prev };
            // Set the new value, or toggle off if it's the same
            newFilters[filter] = prev[filter] === value ? initialFilters[filter] : value;
            
            // Mutually exclusive filters: day vs week
            if (filter === 'day' && value !== null) {
                newFilters.week = null;
            }
            if (filter === 'week' && value !== null) {
                newFilters.day = null;
            }
            
            return newFilters;
        });
    }, [setFilters]);

    const handleClearFilters = useCallback(() => {
        setFilters(initialFilters);
    }, [setFilters]);

    const handleOpenAddModule = () => {
        setIsAddModuleDrawerOpen(true);
    };

    const handleSaveNewModule = async (newModule: Module) => {
        await onAddModule(newModule);
        setIsAddModuleDrawerOpen(false);
    };

    const { currentTerm, modulesInTerm, assessmentsInTerm } = useMemo(() => {
        if (!activeTermId || formData.degree.terms.length === 0) {
            return { currentTerm: null, modulesInTerm: [], assessmentsInTerm: [] };
        }
        
        const allPossibleTerms = getAllTermsWithYears(formData.degree.terms);
        const term = allPossibleTerms.find(t => t.id === activeTermId) || null;
        
        if (!term) {
             console.warn(`Could not find active term with id: ${activeTermId}`);
             return { currentTerm: null, modulesInTerm: [], assessmentsInTerm: [] };
        }
        
        let modules: Module[];
        const termMap = new Map(allPossibleTerms.map(t => [t.id, t]));

        const getTermType = (term: AcademicTerm): TermType => {
            if (term.id.startsWith('year-')) return 'Year';
            if (!term.parentTermId) return 'Semester';
            return 'Quarter';
        };

        if (filterMode === 'focused') {
            modules = formData.modules.filter(m => m.anchorTermId === term.id);
        } else { // broad, strict, or smart
            const termStart = parseISO(term.startDate);
            const termEnd = parseISO(term.endDate);

            modules = formData.modules.filter(mod => {
                const modAnchorTerm = termMap.get(mod.anchorTermId);
                const modStartStr = mod.startDate || modAnchorTerm?.startDate;
                const modEndStr = mod.endDate || modAnchorTerm?.endDate;
                
                if (!modStartStr || !modEndStr) return false;

                try {
                    const modStart = parseISO(modStartStr);
                    const modEnd = parseISO(modEndStr);
                    
                    // FIX: Restructured logic to explicitly handle filter modes and fix type narrowing.
                    let behavior: 'broad' | 'strict';
                    if (filterMode === 'broad' || filterMode === 'strict') {
                        behavior = filterMode;
                    } else { // This handles 'smart'
                        const selectedTermType = getTermType(term);
                        behavior = (selectedTermType === 'Year' || selectedTermType === 'Semester') ? 'broad' : 'strict';
                    }

                    if (behavior === 'broad') {
                        // Overlap: (StartA <= EndB) and (EndA >= StartB)
                        return modStart <= termEnd && modEnd >= termStart;
                    } else { // strict
                        // Containment: (StartA >= StartB) and (EndA <= EndB)
                        return modStart >= termStart && modEnd <= termEnd;
                    }
                } catch {
                    return false;
                }
            });
        }
        
        const moduleCodes = new Set(modules.map(m => m.moduleCode));
        const assessments = formData.importedAssessments.filter(a => moduleCodes.has(a.moduleCode));

        return { currentTerm: term, modulesInTerm: modules, assessmentsInTerm: assessments };
    }, [activeTermId, formData.degree.terms, formData.modules, formData.importedAssessments, filterMode]);

    // Filter and sort modules
    const activeModules = useMemo(() => {
        if (!currentTerm) return [];
        
        const baseModules = modulesInTerm;
        const termStartDate = parseISO(currentTerm.startDate);

        // Apply filters
        const filteredModules = baseModules.filter(m => {
            if (filters.status && getModuleStatusText(m) !== filters.status) return false;
            if (filters.moduleType && m.moduleType !== filters.moduleType) return false;
            if (filters.hasOverdue && (m.calculated_late_count ?? 0) === 0) return false;
            if (filters.hasExamRisk) {
                const hasRisk = (m.minExamEntrance ?? 0) > 0 && (m.calculated_current_grade ?? 101) < m.minExamEntrance;
                if (!hasRisk) return false;
            }
            if (filters.day) {
                const hasItemOnDay = assessmentsInTerm.some(a => a.moduleCode === m.moduleCode && a.status === 'Upcoming' && a.dueDate === filters.day);
                if (!hasItemOnDay) return false;
            }
            if (filters.week) {
                 const weekStartDate = addDays(termStartDate, (filters.week - 1) * 7);
                 const weekEndDate = addDays(weekStartDate, 6);
                 const hasItemInWeek = assessmentsInTerm.some(a => 
                    a.moduleCode === m.moduleCode && 
                    a.dueDate && a.dueDate !== 'TBC' &&
                    isWithinInterval(parseISO(a.dueDate), { start: weekStartDate, end: weekEndDate })
                 );
                 if (!hasItemInWeek) return false;
            }
            return true;
        });

        // Apply sorting
        return [...filteredModules].sort((a, b) => {
            switch (sortKey) {
                case 'risk':
                    const statusOrder: Record<string, number> = { 'At Risk': 0, 'Needs Attention': 1, 'On Track': 2 };
                    return (statusOrder[getModuleStatusText(a) ?? ''] ?? 3) - (statusOrder[getModuleStatusText(b) ?? ''] ?? 3);
                case 'currentMark':
                    return (b.calculated_current_grade ?? -1) - (a.calculated_current_grade ?? -1);
                case 'completion':
                    return (b.calculated_completion_progress ?? -1) - (a.calculated_completion_progress ?? -1);
                case 'nextDueDate':
                    const nextDueA = assessmentsInTerm.filter(ass => ass.moduleCode === a.moduleCode && ass.status === 'Upcoming' && ass.dueDate !== 'TBC').sort((x, y) => parseISO(x.dueDate).getTime() - parseISO(y.dueDate).getTime())[0];
                    const nextDueB = assessmentsInTerm.filter(ass => ass.moduleCode === b.moduleCode && ass.status === 'Upcoming' && ass.dueDate !== 'TBC').sort((x, y) => parseISO(x.dueDate).getTime() - parseISO(y.dueDate).getTime())[0];
                    if (!nextDueA) return 1;
                    if (!nextDueB) return -1;
                    return parseISO(nextDueA.dueDate).getTime() - parseISO(nextDueB.dueDate).getTime();
                case 'moduleName':
                    return a.moduleName.localeCompare(b.moduleName);
                default:
                    return 0;
            }
        });
        
    }, [currentTerm, modulesInTerm, assessmentsInTerm, filters, sortKey]);
    
    // Accessibility announcements
    useEffect(() => {
        const atRiskCount = activeModules.filter(m => getModuleStatusText(m) === 'At Risk').length;
        if (atRiskCount > 0) {
            setAnnouncement(`${atRiskCount} module${atRiskCount > 1 ? 's' : ''} at risk.`);
        }
    }, [activeModules]);

    // If there's no data at all, show a welcome/empty state.
    if (!isLoading && formData.modules.length === 0 && formData.importedAssessments.length === 0) {
        // Move this early return after all hooks are declared to fix "fewer hooks" error
        return <EmptyState onReset={onReset} onAddModule={handleOpenAddModule} />;
    }

    // Keyboard navigation for the grid
    const handleGridKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        const numTiles = activeModules.length;
        if (numTiles === 0) return;

        let nextIndex = focusedTileIndex ?? -1;
        const numCols = window.innerWidth >= 768 ? 2 : 1;

        if (e.key === 'ArrowRight') nextIndex = Math.min(numTiles - 1, nextIndex + 1);
        else if (e.key === 'ArrowLeft') nextIndex = Math.max(0, nextIndex - 1);
        else if (e.key === 'ArrowDown') nextIndex = Math.min(numTiles - 1, nextIndex + numCols);
        else if (e.key === 'ArrowUp') nextIndex = Math.max(0, nextIndex - numCols);
        else if (e.key === 'Enter' && focusedTileIndex !== null) {
            e.preventDefault();
            handleModuleClick(activeModules[focusedTileIndex]);
            return;
        } else {
            return;
        }

        e.preventDefault();
        if (nextIndex >= 0 && nextIndex < numTiles) {
            setFocusedTileIndex(nextIndex);
            tileRefs.current[nextIndex]?.focus();
        }
    };

    const handleModuleClick = (module: Module) => setSelectedModule(module);
    const handleCloseDialog = () => setSelectedModule(null);
    const handleViewDetails = (offeringId: string) => {
        setSelectedModule(null);
        onModuleClick(offeringId);
    };

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
            {toastMessage && <Toast message={toastMessage} onClose={onClearToast} />}
            {/* Screen reader announcements */}
            <div aria-live="polite" aria-atomic="true" className="sr-only">
                {announcement}
            </div>

            <GlobalHeader 
                academicInfo={formData.academicInfo}
                degree={formData.degree}
                today={today}
                isCompact={isCompact}
                onToggleCompact={() => setIsCompact(!isCompact)}
                onNavigateToTermNavigator={onNavigateToTermNavigator}
                onNavigateToSettings={onNavigateToSettings}
                terms={formData.degree.terms}
                onAddModule={handleOpenAddModule}
                filterMode={filterMode}
            />
            
            <main className="max-w-8xl mx-auto p-4 sm:p-6 lg:p-8">
                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Center Column */}
                    <div className="lg:col-span-8 space-y-6">
                        <ModulesOverviewControls
                            sortKey={sortKey}
                            onSortChange={setSortKey}
                            filters={filters}
                            onFilterChange={handleFilterChange}
                            onClearFilters={handleClearFilters}
                            moduleCount={activeModules.length}
                        />
                        <div
                            ref={gridRef}
                            onKeyDown={handleGridKeyDown}
                            tabIndex={-1}
                            className="grid grid-cols-1 md:grid-cols-2 gap-6 focus:outline-none"
                            role="grid"
                            aria-label="Modules Overview"
                        >
                            {activeModules.length > 0 ? activeModules.map((module, index) => (
                                <ModuleTile 
                                    key={module.offeringId} 
                                    module={module} 
                                    assessments={assessmentsInTerm.filter(a => a.moduleCode === module.moduleCode)}
                                    today={today}
                                    onClick={handleModuleClick}
                                    isCompact={isCompact}
                                    isFocused={focusedTileIndex === index}
                                    ref={el => { tileRefs.current[index] = el; }}
                                />
                            )) : !isLoading && (
                                <div className="md:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm text-center border-2 border-dashed">
                                  <p className="font-semibold text-lg">No Modules Match Filters</p>
                                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Try clearing some filters to see more of your modules.</p>
                                   <button onClick={handleClearFilters} className="mt-4 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg text-sm">Clear Filters</button>
                                </div>
                            )}
                            {isLoading && Array.from({length: 4}).map((_, i) => <div key={i} className="h-72 bg-white dark:bg-slate-800 rounded-xl shadow-sm animate-pulse"></div>)}
                        </div>
                    </div>
                    
                    {/* Right Column (Sticky) */}
                    <aside className="lg:col-span-4">
                        <div className="lg:sticky lg:top-24 space-y-6">
                            <PriorityActionsPane 
                                assessments={assessmentsInTerm} 
                                today={today}
                                term={currentTerm}
                                activeDayFilter={filters.day} 
                                activeWeekFilter={filters.week}
                                isLoading={isLoading}
                            />
                            <DayOverloadPane 
                                assessments={assessmentsInTerm} 
                                settings={formData.systemSettings} 
                                today={today}
                                onFilter={(day) => handleFilterChange('day', day)}
                                activeFilter={filters.day}
                                isLoading={isLoading}
                                setAnnouncement={setAnnouncement}
                            />
                        </div>
                    </aside>
                </div>
            </main>

            {selectedModule && (
                <ModuleOverviewDialog 
                    module={selectedModule} 
                    assessments={assessmentsInTerm.filter(a => a.moduleCode === selectedModule.moduleCode)}
                    onClose={handleCloseDialog}
                    onViewDetails={handleViewDetails}
                    today={today}
                />
            )}

            <CreateModuleDrawer
                isOpen={isAddModuleDrawerOpen}
                onClose={() => setIsAddModuleDrawerOpen(false)}
                onSave={handleSaveNewModule}
                allModules={formData.modules}
                allTerms={formData.degree.terms}
                activeTermId={activeTermId}
            />
        </div>
    );
};

// --- Sub-Components ---

const EmptyState: React.FC<{ onReset: () => void; onAddModule: () => void; }> = ({ onReset, onAddModule }) => (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-8">
        <div className="max-w-xl mx-auto text-center bg-white dark:bg-slate-800 p-12 rounded-xl shadow-lg">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">Welcome to Academic-OS!</h1>
            <p className="mt-4 text-slate-600 dark:text-slate-400">Your dashboard is ready. Add your first module or import your data to see academic insights here.</p>
            <div className="mt-8 flex justify-center gap-4">
                <button onClick={onAddModule} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">Add New Module</button>
                <button onClick={onReset} className="px-6 py-2 bg-slate-200 dark:bg-slate-700 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600">Restart Setup</button>
            </div>
        </div>
    </div>
);

export default Dashboard;