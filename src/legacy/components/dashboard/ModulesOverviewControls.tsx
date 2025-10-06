import React from 'react';
import { format, parseISO } from 'date-fns';
import { Icon } from '../ui/Icon';

export type SortKey = 'risk' | 'currentMark' | 'completion' | 'nextDueDate' | 'moduleName';
export type StatusFilter = 'On Track' | 'Needs Attention' | 'At Risk' | null;
export type ModuleTypeFilter = 'Core' | 'Elective' | null;
// FIX: Add 'smart' to FilterMode to align with its usage across the app and fix type errors.
export type FilterMode = 'broad' | 'focused' | 'strict' | 'smart';

export interface Filters {
    status: StatusFilter;
    moduleType: ModuleTypeFilter;
    hasExamRisk: boolean;
    hasOverdue: boolean;
    day: string | null;
    week: number | null;
}

export const initialFilters: Filters = {
    status: null,
    moduleType: null,
    hasExamRisk: false,
    hasOverdue: false,
    day: null,
    week: null,
};


interface Props {
    sortKey: SortKey;
    onSortChange: (key: SortKey) => void;
    filters: Filters;
    onFilterChange: <K extends keyof Filters>(filter: K, value: Filters[K]) => void;
    onClearFilters: () => void;
    moduleCount: number;
}

const sortOptions: { value: SortKey; label: string }[] = [
    { value: 'risk', label: 'Risk (Status)' },
    { value: 'currentMark', label: 'Current Mark' },
    { value: 'completion', label: 'Completion Progress' },
    { value: 'nextDueDate', label: 'Next Due Date' },
    { value: 'moduleName', label: 'Module Name' },
];

const statusFilters: StatusFilter[] = ['On Track', 'Needs Attention', 'At Risk'];
const typeFilters: ModuleTypeFilter[] = ['Core', 'Elective'];

const FilterChip: React.FC<{ label: string; onRemove: () => void }> = ({ label, onRemove }) => (
    <div className="flex items-center gap-1.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full text-sm pl-3 pr-2 py-1">
        <span>{label}</span>
        <button onClick={onRemove} className="rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 p-0.5" aria-label={`Remove ${label} filter`}>
            <Icon name="X" className="w-4 h-4" strokeWidth={2} />
        </button>
    </div>
);

const ModulesOverviewControls: React.FC<Props> = ({ sortKey, onSortChange, filters, onFilterChange, onClearFilters, moduleCount }) => {
    
    const activeFilterCount = Object.values(filters).filter(v => v !== null && v !== false).length;

    return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                    Modules Overview <span className="text-base font-medium text-slate-500">({moduleCount})</span>
                </h2>
                <div className="flex items-center gap-4">
                    <label htmlFor="sort-modules" className="text-sm font-medium text-slate-600 dark:text-slate-400 flex-shrink-0">Sort by:</label>
                    <select
                        id="sort-modules"
                        value={sortKey}
                        onChange={(e) => onSortChange(e.target.value as SortKey)}
                        className="w-full md:w-auto text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 py-1.5 pl-3 pr-8"
                    >
                        {sortOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 border-t border-slate-200 dark:border-slate-700 pt-4">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400 flex-shrink-0">Filter by:</span>
                <div className="flex flex-wrap gap-2">
                    {statusFilters.map(s => s && (
                        <button key={s} onClick={() => onFilterChange('status', s)} className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-colors ${filters.status === s ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'}`}>{s}</button>
                    ))}
                    <div className="border-l border-slate-300 dark:border-slate-600 mx-2 h-5"></div>
                    {typeFilters.map(t => t && (
                        <button key={t} onClick={() => onFilterChange('moduleType', t)} className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-colors ${filters.moduleType === t ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'}`}>{t}</button>
                    ))}
                    <div className="border-l border-slate-300 dark:border-slate-600 mx-2 h-5"></div>
                    <button onClick={() => onFilterChange('hasOverdue', !filters.hasOverdue)} className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-colors ${filters.hasOverdue ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'}`}>Has Overdue</button>
                    <button onClick={() => onFilterChange('hasExamRisk', !filters.hasExamRisk)} className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-colors ${filters.hasExamRisk ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'}`}>Exam Risk</button>
                </div>
            </div>

             {activeFilterCount > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-sm font-semibold">Active:</span>
                    {filters.status && <FilterChip label={`Status: ${filters.status}`} onRemove={() => onFilterChange('status', null)} />}
                    {filters.moduleType && <FilterChip label={`Type: ${filters.moduleType}`} onRemove={() => onFilterChange('moduleType', null)} />}
                    {filters.hasOverdue && <FilterChip label="Has Overdue" onRemove={() => onFilterChange('hasOverdue', false)} />}
                    {filters.hasExamRisk && <FilterChip label="Exam Risk" onRemove={() => onFilterChange('hasExamRisk', false)} />}
                    {filters.day && <FilterChip label={`Due: ${format(parseISO(filters.day), 'MMM d')}`} onRemove={() => onFilterChange('day', null)} />}
                    {filters.week && <FilterChip label={`Week ${filters.week}`} onRemove={() => onFilterChange('week', null)} />}

                    <button onClick={onClearFilters} className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline ml-auto">Clear all ({activeFilterCount})</button>
                </div>
            )}
        </div>
    );
};

export default ModulesOverviewControls;