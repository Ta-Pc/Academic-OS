import React, { useMemo, forwardRef, useEffect, useRef } from 'react';
import { Module, Assessment } from '../types';
import { parseISO, formatDistanceToNowStrict } from 'date-fns';
import { NotAvailable } from '../utils/uiHelpers';
import { Icon, IconName } from './ui/Icon';

// --- Helper Functions ---

const getModuleStatus = (module: Module): { text: string; color: string; icon: IconName } => {
    const { calculated_current_grade, targetFinalGrade, minFinalGrade } = module;

    if (calculated_current_grade === undefined || calculated_current_grade === null) return { text: 'No Grade Data', color: 'slate', icon: 'AlertTriangle' };
    if (calculated_current_grade >= targetFinalGrade) return { text: 'On Track', color: 'green', icon: 'CheckCircle2' };
    if (calculated_current_grade >= (minFinalGrade ?? 50)) return { text: 'Needs Attention', color: 'yellow', icon: 'AlertTriangle' };
    return { text: 'At Risk', color: 'red', icon: 'XCircle' };
};


// --- Component ---

interface ModuleTileProps {
    module: Module;
    assessments: Assessment[];
    today: Date;
    onClick: (module: Module) => void;
    isCompact: boolean;
    isFocused: boolean;
}

const ModuleTile = forwardRef<HTMLButtonElement, ModuleTileProps>(({ module, assessments, today, onClick, isCompact, isFocused }, ref) => {
    const internalRef = useRef<HTMLButtonElement>(null);
    const buttonRef = ref || internalRef;
    
    useEffect(() => {
        if (isFocused && buttonRef && 'current' in buttonRef && buttonRef.current) {
            buttonRef.current.focus();
        }
    }, [isFocused, buttonRef]);

    const nextDue = useMemo(() => {
        return assessments
            .filter(a => a.status === 'Upcoming' && a.dueDate && parseISO(a.dueDate) >= today)
            .sort((a, b) => {
                if(a.dueDate === 'TBC') return 1;
                if(b.dueDate === 'TBC') return -1;
                return parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime()
            })[0] || null;
    }, [assessments, today]);

    const status = getModuleStatus(module);
    const completion = module.calculated_completion_progress ?? 0;
    
    const categoryPerformance = useMemo(() => {
        return Object.entries(module.calculated_category_performance ?? {})
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3);
    }, [module.calculated_category_performance]);
    
    if (isCompact) {
        return (
             <button 
                ref={buttonRef}
                onClick={() => onClick(module)} 
                className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 w-full text-left transition-all duration-200 hover:shadow-md hover:border-blue-500 dark:hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-4 animate-fade-in"
                aria-label={`View details for ${module.moduleName}`}
            >
                <div className={`flex-shrink-0 text-2xl font-bold p-3 rounded-md text-${status.color}-700 bg-${status.color}-100 dark:text-${status.color}-200 dark:bg-${status.color}-500/20`}>
                    {module.calculated_current_grade !== undefined ? module.calculated_current_grade.toFixed(0) : '-'}
                </div>
                <div className="flex-grow">
                    <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{module.moduleCode}: {module.moduleName}</p>
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span>{status.text}</span>
                        <span>{completion.toFixed(0)}% Locked</span>
                    </div>
                </div>
            </button>
        )
    }

    return (
        <button 
            ref={buttonRef}
            onClick={() => onClick(module)} 
            className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 w-full text-left transition-all duration-200 hover:shadow-lg hover:border-blue-500 dark:hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 animate-fade-in"
            style={{ animationDelay: '50ms', opacity: 0 }}
            aria-label={`View details for ${module.moduleName}`}
        >
            {/* Top row: Code, Name, Status */}
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold text-lg text-slate-800 dark:text-slate-200">{module.moduleCode}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-[180px]" title={module.moduleName}>{module.moduleName}</p>
                </div>
                 <div className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full text-${status.color}-700 bg-${status.color}-100 dark:text-${status.color}-300 dark:bg-${status.color}-500/20`}>
                   <Icon name={status.icon} className={`w-3.5 h-3.5 text-${status.color}-500`} strokeWidth={2} />
                   {status.text}
                </div>
            </div>
            
            {/* Metric: Current Mark */}
            <div className="flex items-baseline gap-2 mt-4">
                {module.calculated_current_grade !== undefined ? (
                    <>
                    <p className="text-5xl font-extrabold text-slate-800 dark:text-slate-100">{module.calculated_current_grade.toFixed(0)}</p>
                    <p className="text-3xl font-bold text-slate-500 dark:text-slate-400 -ml-1">%</p>
                    </>
                ) : (
                    <p className="text-3xl font-bold text-slate-800 dark:text-slate-100"><NotAvailable tooltipText="No graded work yet" /></p>
                )}
                <div title="Trend vs last week (placeholder)">
                    <Icon name="TrendingUp" className="w-6 h-6 text-green-500" />
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
                <div className="flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                    <span>{completion.toFixed(0)}%</span>
                    <span>Grade locked in</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                    <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${completion}%` }}></div>
                </div>
            </div>

            {/* Context Chips */}
            {categoryPerformance.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                    {categoryPerformance.map(([cat, perf]) => (
                        <div key={cat} className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300">
                            {cat}: <span className="font-bold">{perf.toFixed(0)}%</span>
                        </div>
                    ))}
                </div>
            )}
            
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
                {/* Next Action */}
                <div className="text-sm">
                    {nextDue ? (
                        <>
                            <span className="font-bold text-slate-700 dark:text-slate-300">Next:</span>
                            <span className="ml-2 text-slate-600 dark:text-slate-400">{nextDue.assessmentName}</span>
                            {nextDue.dueDate === 'TBC' 
                                ? <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full border border-dashed border-slate-400 dark:border-slate-500 text-slate-500 dark:text-slate-400">Tentative</span>
                                : <span className="ml-2 font-semibold text-blue-600 dark:text-blue-400">{formatDistanceToNowStrict(parseISO(nextDue.dueDate), { addSuffix: true })}</span>
                            }
                        </>
                    ) : <p className="text-sm text-slate-500 dark:text-slate-400">No upcoming actions</p>}
                </div>
                
                {/* Tiny Counters */}
                <div className="flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                    <span className="text-red-600 dark:text-red-500">Overdue: {module.calculated_late_count ?? 0}</span>
                    <span className="text-yellow-600 dark:text-yellow-400">Next 7 days: {module.calculated_upcoming_count ?? 0}</span>
                </div>
            </div>
        </button>
    );
});

export default ModuleTile;