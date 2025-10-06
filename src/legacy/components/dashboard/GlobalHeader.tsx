import React from 'react';
import { AcademicInfo, Degree, AcademicTerm } from '../../types';
import { format } from 'date-fns';
import AddMenu from './AddMenu';
import CompactViewToggle from './CompactViewToggle';
import GlobalTermSelector from './GlobalTermSelector';
import { useTerm } from '../contexts/TermContext';
import { FilterMode } from './ModulesOverviewControls';
import { Icon } from '../ui/Icon';


interface Props {
    academicInfo: AcademicInfo;
    degree: Degree;
    today: Date;
    isCompact: boolean;
    onToggleCompact: () => void;
    onNavigateToTermNavigator: () => void;
    onNavigateToSettings: (initialTab?: string) => void;
    terms: AcademicTerm[];
    onAddModule: () => void;
    filterMode: FilterMode;
}

// FIX: Add 'smart' property to satisfy Record<FilterMode, string> type.
const filterModeDescriptions: Record<FilterMode, string> = {
    broad: 'active in',
    focused: 'assigned to',
    strict: 'fully within',
    smart: 'smartly filtered for'
};

const GlobalHeader: React.FC<Props> = ({ academicInfo, degree, today, isCompact, onToggleCompact, onNavigateToTermNavigator, onNavigateToSettings, terms, onAddModule, filterMode }) => {
    const { activeTermId } = useTerm();
    const activeTerm = terms.find(t => t.id === activeTermId);
    const description = filterModeDescriptions[filterMode];
    
    return (
        <header className="sticky top-0 z-30 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
            <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Left side */}
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200 truncate hidden sm:block">Welcome, {academicInfo.name}!</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 hidden sm:block">{format(today, 'EEEE, d MMMM')}</p>
                        
                        {/* Mobile Term Selector */}
                        <div className="sm:hidden text-center">
                            <GlobalTermSelector terms={terms} isMobile={true} />
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                Showing modules {description}{' '}
                                <span className="font-semibold">{activeTerm?.termName || 'Term'}</span>.{' '}
                                <button
                                    onClick={() => onNavigateToSettings('preferences')}
                                    className="text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    Change
                                </button>
                            </p>
                        </div>
                    </div>


                    {/* Center */}
                    <div className="hidden lg:flex flex-col items-center">
                        <GlobalTermSelector terms={terms} />
                         <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Showing modules {description}{' '}
                            <span className="font-semibold">{activeTerm?.termName || 'Term'}</span>.{' '}
                            <button
                                onClick={() => onNavigateToSettings('preferences')}
                                className="text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                Change
                            </button>
                        </p>
                    </div>

                    {/* Right side */}
                    <div className="flex flex-1 items-center justify-end gap-4">
                        <button onClick={onNavigateToTermNavigator} className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700">
                            <Icon name="Search" className="w-5 h-5 text-slate-500 dark:text-slate-400" strokeWidth={1.5} />
                            Term Navigator
                        </button>
                        <CompactViewToggle isCompact={isCompact} onToggle={onToggleCompact} />
                        <AddMenu onAddModule={onAddModule} />
                        <div className="border-l border-slate-300 dark:border-slate-600 h-6"></div>
                        <button
                            onClick={() => onNavigateToSettings()}
                            className="p-2 text-slate-500 dark:text-slate-400 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                            aria-label="Open settings"
                        >
                            <Icon name="Settings" className="w-6 h-6" strokeWidth={1.5} />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default GlobalHeader;