import React from 'react';

interface Props {
    isCompact: boolean;
    onToggle: () => void;
}

const CompactViewToggle: React.FC<Props> = ({ isCompact, onToggle }) => {
    return (
        <div className="hidden sm:flex items-center gap-2">
            <label 
                htmlFor="compact-view" 
                className="text-sm font-medium text-slate-600 dark:text-slate-400 cursor-pointer"
                onClick={onToggle}
            >
                Compact view
            </label>
            <button
                id="compact-view"
                type="button"
                role="switch"
                aria-checked={isCompact}
                onClick={onToggle}
                className={`${isCompact ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
            >
                <span className={`${isCompact ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
            </button>
        </div>
    );
};

export default CompactViewToggle;