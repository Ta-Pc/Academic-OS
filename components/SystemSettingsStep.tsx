import React from 'react';
import { SystemSettings, Language, EffortCategory } from '../types';

interface Props {
  settings: SystemSettings;
  setSettings: (settings: SystemSettings) => void;
  onNext: () => void;
  onBack: () => void;
}

const LANGUAGES: { code: Language; name: string }[] = [
    { code: 'en', name: 'English' },
    { code: 'zu', name: 'isiZulu' },
    { code: 'af', name: 'Afrikaans' },
    { code: 'xh', name: 'isiXhosa' },
    { code: 'st', name: 'Sesotho' },
    { code: 'nso', name: 'Sepedi' },
];

const EFFORT_CATEGORIES: EffortCategory[] = ['Quick Win', 'Standard', 'Deep Dive', 'Emergency Rescue', 'Group Project'];


const SystemSettingsStep: React.FC<Props> = ({ settings, setSettings, onNext, onBack }) => {

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    setSettings({ ...settings, theme });
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSettings({ ...settings, language: e.target.value as Language });
  };
  
  const handleNotificationToggle = () => {
    setSettings({
      ...settings,
      dueDateReminders: !settings.dueDateReminders
    });
  };

  const handleDefaultEffortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSettings({ ...settings, defaultEffort: e.target.value as EffortCategory });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Configure System Settings</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Set your core preferences for the first-time experience.</p>
      </div>
      
      <div className="space-y-6">
        {/* Theme Settings */}
        <div>
          <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200">Appearance</h3>
          <fieldset className="mt-2">
            <legend className="sr-only">Appearance theme</legend>
            <div className="flex items-center space-x-4">
              <ThemeOption label="Light" value="light" selected={settings.theme} onChange={handleThemeChange} />
              <ThemeOption label="Dark" value="dark" selected={settings.theme} onChange={handleThemeChange} />
              <ThemeOption label="System" value="system" selected={settings.theme} onChange={handleThemeChange} />
            </div>
          </fieldset>
        </div>

        {/* Language Settings */}
        <div>
          <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200">Language</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Choose the application language.</p>
          <select value={settings.language} onChange={handleLanguageChange} className="mt-2 block w-full pl-3 pr-10 py-2 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
            {LANGUAGES.map(lang => <option key={lang.code} value={lang.code}>{lang.name}</option>)}
          </select>
        </div>

        {/* Notification Settings */}
        <div>
          <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200">Notifications</h3>
          <NotificationToggle label="Enable due date reminders" checked={settings.dueDateReminders} onChange={handleNotificationToggle} />
        </div>
        
        {/* Default Effort */}
        <div>
            <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200">Default Effort</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Set the default effort for new tasks.</p>
            <select value={settings.defaultEffort} onChange={handleDefaultEffortChange} className="mt-2 block w-full pl-3 pr-10 py-2 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                {EFFORT_CATEGORIES.map(effort => <option key={effort} value={effort}>{effort}</option>)}
            </select>
        </div>
      </div>

      <div className="flex justify-between items-center pt-4">
        <button onClick={onBack} className="px-6 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600">
          Back
        </button>
        <button onClick={onNext} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75">
          Save & Next
        </button>
      </div>
    </div>
  );
};

// Helper components
interface ThemeOptionProps {
  label: string;
  value: 'light' | 'dark' | 'system';
  selected: string;
  onChange: (value: 'light' | 'dark' | 'system') => void;
}
const ThemeOption: React.FC<ThemeOptionProps> = ({ label, value, selected, onChange }) => (
  <label className={`cursor-pointer border rounded-md py-2 px-4 flex-1 text-center font-medium transition-all duration-200 ${selected === value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'}`} >
    <input type="radio" name="theme" value={value} checked={selected === value} onChange={() => onChange(value)} className="sr-only" />
    {label}
  </label>
);

interface NotificationToggleProps {
  label: string;
  checked: boolean;
  onChange: () => void;
}
const NotificationToggle: React.FC<NotificationToggleProps> = ({ label, checked, onChange }) => (
  <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 p-3 rounded-md">
    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
    <button type="button" onClick={onChange} className={`${checked ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}>
      <span className={`${checked ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
    </button>
  </div>
);

export default SystemSettingsStep;