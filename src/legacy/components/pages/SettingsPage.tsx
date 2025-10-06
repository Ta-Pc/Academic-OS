import React, { useState } from 'react';
import ManageCalendarPage from './ManageCalendarPage';
import ImportCsvStep from '../ImportCsvStep';
import { FormData, Module, FilterMode } from '../../types';
import ManageArchivedModulesPage from './settings/ManageArchivedModulesPage';
import { generateFullBackupData } from '../../services/database';
import ResetApplicationModal from '../settings/ResetApplicationModal';
import { Icon } from '../ui/Icon';

const PlaceholderContent: React.FC<{title: string}> = ({ title }) => (
    <div className="p-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">{title}</h2>
        <p className="mt-2 text-slate-500 dark:text-slate-400">This section is under construction. Check back soon!</p>
    </div>
);

const NAV_SECTIONS = [
    {
        title: 'Account & Profile',
        items: [
            { id: 'profile', label: 'Profile', icon: <Icon name="UserCircle" className="w-5 h-5" /> },
        ]
    },
    {
        title: 'Application Preferences',
        items: [
            // FIX: Corrected icon name from 'PaintBrush' to 'Paintbrush' to match updated icon mapping.
            { id: 'preferences', label: 'Preferences', icon: <Icon name="Paintbrush" className="w-5 h-5" /> },
        ]
    },
    {
        title: 'Academic Setup',
        items: [
            { id: 'degree', label: 'Degree & Modules', icon: <Icon name="GraduationCap" className="w-5 h-5" /> },
            { id: 'calendar', label: 'Calendar', icon: <Icon name="Calendar" className="w-5 h-5" /> },
        ]
    },
    {
        title: 'Data Management',
        items: [
            { id: 'import', label: 'Import Data', icon: <Icon name="ArrowDownToLine" className="w-5 h-5" /> },
            { id: 'export', label: 'Export Data', icon: <Icon name="ArrowUpFromLine" className="w-5 h-5" /> },
            { id: 'modules', label: 'Manage Modules', icon: <Icon name="Archive" className="w-5 h-5" /> },
        ]
    },
    {
        title: 'Danger Zone',
        isDanger: true,
        items: [
            { id: 'reset', label: 'Reset Application', icon: <Icon name="AlertTriangle" className="w-5 h-5" />, isAction: true },
        ]
    }
];

interface SettingsPageProps {
    onBack: () => void;
    initialTab?: string;
    onReset: () => void;
    formData: FormData;
    updateFormData: <K extends keyof FormData>(section: K, data: FormData[K]) => void;
    updateModules: (modules: Module[]) => void;
    onUpdateModule: (module: Module, originalModuleCode?: string) => Promise<void>;
    onDeleteModule: (moduleCode: string) => Promise<void>;
    filterMode: FilterMode;
    onFilterModeChange: (mode: FilterMode) => void;
}

interface FilterModeOptionProps {
    id: FilterMode;
    label: string;
    description: string;
    currentMode: FilterMode;
    onChange: (mode: FilterMode) => void;
}

const FilterModeOption: React.FC<FilterModeOptionProps> = ({ id, label, description, currentMode, onChange }) => (
    <label htmlFor={id} className="flex items-start p-4 border border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50 has-[:checked]:bg-blue-50 dark:has-[:checked]:bg-blue-900/20 has-[:checked]:border-blue-500">
        <input
            type="radio"
            name="filter-mode"
            id={id}
            value={id}
            checked={currentMode === id}
            onChange={() => onChange(id)}
            className="h-4 w-4 mt-1 text-blue-600 border-slate-300 focus:ring-blue-500"
        />
        <div className="ml-3 text-sm">
            <span className="font-medium text-slate-900 dark:text-slate-100">{label}</span>
            <p className="text-slate-500 dark:text-slate-400 mt-1">{description}</p>
        </div>
    </label>
);

const SettingsPage: React.FC<SettingsPageProps> = ({ onBack, initialTab = 'profile', onReset, formData, updateFormData, updateModules, onUpdateModule, onDeleteModule, filterMode, onFilterModeChange }) => {
    const [activeTab, setActiveTab] = useState(initialTab);
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [exportError, setExportError] = useState<string | null>(null);

    const handleResetConfirm = () => {
        setIsResetModalOpen(false);
        onReset();
    };

    const handleExport = async () => {
        setIsExporting(true);
        setExportError(null);
        try {
            const backupData = await generateFullBackupData();
            const backupJson = JSON.stringify(backupData, null, 2);
            const blob = new Blob([backupJson], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const date = new Date().toISOString().split('T')[0];
            a.download = `Academic-OS_Backup_${date}.json`;
            a.href = url;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to generate backup:", error);
            setExportError("Failed to generate backup. Please try again.");
        } finally {
            setIsExporting(false);
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'profile':
                return <PlaceholderContent title="Account & Profile" />;
            case 'preferences':
                 return (
                    <div className="p-6">
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Application Preferences</h2>
                        <p className="mt-2 text-slate-500 dark:text-slate-400">Customize the look, feel, and behavior of your application.</p>
                        
                        <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700">
                            <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200">Dashboard Filter Behavior</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Choose how modules are displayed by default when you select a term.</p>
                            <fieldset className="mt-4 space-y-4">
                                <legend className="sr-only">Dashboard filter mode</legend>
                                <FilterModeOption
                                    id="smart"
                                    label="Smart Filter (Default)"
                                    description="Shows year-long modules in Semesters (overlap view), but only shows modules fully contained within Quarters (strict view). Recommended for most users."
                                    currentMode={filterMode}
                                    onChange={onFilterModeChange}
                                />
                                <FilterModeOption
                                    id="broad"
                                    label="Active in selected term"
                                    description="Shows any module active during the selected term, including modules that start before or end after (e.g., a year-long module in a semester view)."
                                    currentMode={filterMode}
                                    onChange={onFilterModeChange}
                                />
                                <FilterModeOption
                                    id="focused"
                                    label="Assigned to selected term"
                                    description="Shows only modules whose home term is exactly the one selected. Spanning modules anchored to other terms are hidden."
                                    currentMode={filterMode}
                                    onChange={onFilterModeChange}
                                />
                                <FilterModeOption
                                    id="strict"
                                    label="Fully within selected term"
                                    description="Shows only modules that both start and end inside the selected term’s date range. Spanning modules that extend beyond it are hidden."
                                    currentMode={filterMode}
                                    onChange={onFilterModeChange}
                                />
                            </fieldset>
                        </div>
                    </div>
                );
            case 'degree':
                 return <PlaceholderContent title="Degree & Modules" />;
            case 'calendar':
                return <ManageCalendarPage onBack={onBack} isEmbedded={true} />;
            case 'import':
                return (
                    <div className="p-8">
                        <ImportCsvStep
                            calendarPeriods={formData.degree.terms}
                            setImportedAssessments={(data) => {
                                updateFormData('importedAssessments', data);
                                updateFormData('csvImported', data.length > 0);
                            }}
                            updateModules={updateModules}
                            onNext={() => setActiveTab('profile')}
                            onSkip={() => setActiveTab('profile')}
                        />
                    </div>
                );
            case 'export':
                return (
                    <div className="p-6">
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Export Data</h2>
                        <p className="mt-2 text-slate-500 dark:text-slate-400">
                            Download a full backup of all your data in JSON format. This file can be used to restore your profile later.
                        </p>
                        <div className="mt-6">
                            <button
                                onClick={handleExport}
                                disabled={isExporting}
                                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isExporting ? (
                                    <>
                                        <Icon name="Loader2" className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                                        Generating...
                                    </>
                                ) : (
                                    'Export Full Backup'
                                )}
                            </button>
                            {exportError && <p className="mt-2 text-sm text-red-600">{exportError}</p>}
                        </div>
                    </div>
                );
            case 'modules':
                 return <ManageArchivedModulesPage 
                    allModules={formData.modules}
                    allAssessments={formData.importedAssessments}
                    allTerms={formData.degree.terms}
                    onUpdateModule={onUpdateModule}
                    onDeleteModule={onDeleteModule}
                 />;
            default:
                return <PlaceholderContent title="Settings" />;
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
            <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <button onClick={onBack} className="text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-2 mb-4">
                        <Icon name="ChevronLeft" className="w-5 h-5" strokeWidth={2} />
                        Back to Dashboard
                    </button>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">Settings</h1>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar */}
                    <nav className="md:w-64 flex-shrink-0" aria-label="Settings">
                        <ul className="space-y-6">
                            {NAV_SECTIONS.map(section => (
                                <li key={section.title} className={section.isDanger ? 'pt-6 border-t border-slate-200 dark:border-slate-700' : ''}>
                                    <h2 className={`px-3 text-xs font-semibold uppercase tracking-wider ${section.isDanger ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`}>
                                        {section.title}
                                    </h2>
                                    <ul className="mt-2 space-y-1">
                                        {section.items.map(item => {
                                            const isActive = activeTab === item.id;
                                            const isDangerItem = section.isDanger;
                                            const activeClasses = 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300';
                                            const inactiveClasses = isDangerItem
                                                ? 'text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/50'
                                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700';
                                            const iconClasses = isDangerItem ? 'text-red-500' : 'text-slate-500 dark:text-slate-400';
                                            
                                            return (
                                                <li key={item.id}>
                                                    <button
                                                        onClick={() => ('isAction' in item && item.isAction) ? setIsResetModalOpen(true) : setActiveTab(item.id)}
                                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? activeClasses : inactiveClasses}`}
                                                    >
                                                        <span className={isActive && !isDangerItem ? 'text-blue-600 dark:text-blue-400' : iconClasses}>
                                                            {item.icon}
                                                        </span>
                                                        {item.label}
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Content */}
                    <div className="flex-grow bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                        {renderContent()}
                    </div>
                </div>
            </main>
            
            {isResetModalOpen && (
                <ResetApplicationModal
                  onClose={() => setIsResetModalOpen(false)}
                  onConfirmReset={handleResetConfirm}
                />
            )}
        </div>
    );
};

export default SettingsPage;