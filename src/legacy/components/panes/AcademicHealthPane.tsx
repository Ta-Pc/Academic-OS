import React, { useState, useEffect, useMemo } from 'react';
import { AcademicTerm, Module } from '../../types';
import { NotAvailable } from '../../utils/uiHelpers';


type GoalStatus = 'On Track' | 'Needs Attention' | 'At Risk';
type AverageType = 'current' | 'projected';

interface Props {
    term: AcademicTerm;
    modules: Module[];
    onFilter: (status: GoalStatus | null) => void;
    activeFilter: GoalStatus | null;
    isLoading: boolean;
}

const AcademicHealthPane: React.FC<Props> = ({ term, modules, onFilter, activeFilter, isLoading }) => {
    
    const [averageType, setAverageType] = useState<AverageType>(() => {
        return (localStorage.getItem('aos-average-type') as AverageType) || 'current';
    });

    useEffect(() => {
        localStorage.setItem('aos-average-type', averageType);
    }, [averageType]);
    
    const creditWeightedProjectedAvg = useMemo(() => {
        const modulesWithProjection = modules.filter(m => m.calculated_projected_final_grade !== undefined);
        if (modulesWithProjection.length === 0) return undefined;

        const totalWeightedPoints = modulesWithProjection.reduce((sum, m) => sum + (m.calculated_projected_final_grade! * m.credits), 0);
        const totalCredits = modulesWithProjection.reduce((sum, m) => sum + m.credits, 0);

        return totalCredits > 0 ? totalWeightedPoints / totalCredits : undefined;
    }, [modules]);

    const displayAverage = averageType === 'current' ? term.calculated_term_gpa : creditWeightedProjectedAvg;

    const goalAlignment = modules.reduce((acc, module) => {
        const { calculated_current_grade, targetFinalGrade, minFinalGrade } = module;
        if (calculated_current_grade === undefined || calculated_current_grade === null) {
            acc.noData++;
        } else if (calculated_current_grade >= targetFinalGrade) {
            acc.onTrack++;
        } else if (calculated_current_grade >= minFinalGrade) {
            acc.needsAttention++;
        } else {
            acc.atRisk++;
        }
        return acc;
    }, { onTrack: 0, needsAttention: 0, atRisk: 0, noData: 0 });

    const totalWeeklyTime = modules.reduce((sum, mod) => sum + (mod.calculated_weekly_time_spent || 0), 0);
    const hours = Math.floor(totalWeeklyTime / 60);
    const minutes = totalWeeklyTime % 60;
    
    if (isLoading) {
        return (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm animate-pulse">
                <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-6"></div>
                <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-48 mx-auto mb-4"></div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                    <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                    <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                    <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                </div>
                 <div className="mt-6 space-y-2">
                    <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                    <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                    <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm h-full">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Overall Academic Health</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{term.termName} ({term.academicYear})</p>
            
            <div className="flex justify-center my-4">
                <div className="flex p-1 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm font-medium">
                    <button onClick={() => setAverageType('current')} className={`px-3 py-1 rounded-md transition-colors ${averageType === 'current' ? 'bg-white dark:bg-slate-900 shadow text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'}`}>Current</button>
                    <button onClick={() => setAverageType('projected')} className={`px-3 py-1 rounded-md transition-colors ${averageType === 'projected' ? 'bg-white dark:bg-slate-900 shadow text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'}`}>Projected</button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
                <MetricDisplay 
                    label={averageType === 'current' ? 'Term Average' : 'Weighted Projected'}
                    value={displayAverage !== undefined ? `${displayAverage.toFixed(1)}%` : <NotAvailable tooltipText="No graded work yet to calculate average"/>} 
                />
                <MetricDisplay 
                    label="Points Secured" 
                    value={term.calculated_cumulative_points_secured ? `${term.calculated_cumulative_points_secured.toFixed(1)}` : '0'} 
                    sublabel="toward final grade"
                />
                 <MetricDisplay 
                    label="Weekly Study" 
                    value={`${hours}h ${minutes}m`}
                    sublabel="logged this week"
                />
                 <MetricDisplay 
                    label="Modules On Track" 
                    value={`${goalAlignment.onTrack}`}
                    sublabel={`of ${modules.length}`}
                />
            </div>

            <div className="mt-6">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Goal Alignment</p>
                <div className="space-y-2">
                    <StatusBreakdown label="On Track" count={goalAlignment.onTrack} total={modules.length} color="bg-green-500" onClick={() => onFilter('On Track')} isActive={activeFilter === 'On Track'} />
                    <StatusBreakdown label="Needs Attention" count={goalAlignment.needsAttention} total={modules.length} color="bg-yellow-500" onClick={() => onFilter('Needs Attention')} isActive={activeFilter === 'Needs Attention'} />
                    <StatusBreakdown label="At Risk" count={goalAlignment.atRisk} total={modules.length} color="bg-red-500" onClick={() => onFilter('At Risk')} isActive={activeFilter === 'At Risk'} />
                </div>
            </div>
        </div>
    );
};

// --- Sub-Components ---

const MetricDisplay: React.FC<{label: string, value: string | React.ReactNode, sublabel?: string}> = ({ label, value, sublabel }) => (
    <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
        <div className="text-2xl font-bold text-slate-800 dark:text-slate-200 truncate h-8 flex items-center justify-center">
            {value}
        </div>
        {sublabel && <p className="text-xs text-slate-500 dark:text-slate-400 -mt-1">{sublabel}</p>}
    </div>
);

const StatusBreakdown: React.FC<{label: GoalStatus, count: number, total: number, color: string, onClick: () => void, isActive: boolean}> = ({ label, count, total, color, onClick, isActive }) => (
    <button 
        onClick={onClick} 
        className={`w-full text-left p-2 rounded-md transition-all ${isActive ? 'bg-blue-100 dark:bg-blue-900/50 ring-2 ring-blue-500' : 'hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}
        aria-pressed={isActive}
    >
        <div className="flex justify-between items-center text-xs mb-0.5">
            <span className="font-medium text-slate-600 dark:text-slate-300">{label}</span>
            <span className="text-slate-500 dark:text-slate-400">{count} / {total}</span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <div className={`${color} h-2 rounded-full`} style={{ width: total > 0 ? `${(count/total)*100}%` : '0%' }}></div>
        </div>
    </button>
);

export default AcademicHealthPane;