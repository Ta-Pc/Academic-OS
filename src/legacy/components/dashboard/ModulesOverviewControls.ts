

// FIX: Add 'smart' to FilterMode to align with its usage in Dashboard.tsx and the definition in types.ts.
export type SortKey = 'risk' | 'currentMark' | 'completion' | 'nextDueDate' | 'moduleName';
export type StatusFilter = 'On Track' | 'Needs Attention' | 'At Risk' | null;
export type ModuleTypeFilter = 'Core' | 'Elective' | null;
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