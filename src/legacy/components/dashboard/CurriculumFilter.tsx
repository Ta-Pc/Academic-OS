import React from 'react';
import { FilterMode } from './ModulesOverviewControls';

interface Props {
    mode: FilterMode;
    onModeChange: (mode: FilterMode) => void;
    termName: string;
}

const CurriculumFilter: React.FC<Props> = ({ mode, onModeChange, termName }) => {
    
    const options: { id: FilterMode; label: string; description: string }[] = [
        { id: 'broad', label: `Active in ${termName}`, description: 'Shows modules whose date range overlaps with this term.' },
        { id: 'focused', label: `Assigned to ${termName}`, description: 'Shows only modules anchored to this specific term.' },
        { id: 'strict', label: `Fully within ${termName}`, description: 'Shows modules that start and end completely within this term.' },
    ];

    return (
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            {options.map(option => (
                <button
                    key={option.id}
                    onClick={() => onModeChange(option.id)}
                    className={`px-3 py-1 rounded-md transition-all text-sm font-semibold w-full whitespace-nowrap ${mode === option.id 
                        ? 'bg-white dark:bg-slate-900 shadow-sm text-blue-600 dark:text-blue-400' 
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                    }`}
                    title={option.description}
                    aria-pressed={mode === option.id}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
};

export default CurriculumFilter;
