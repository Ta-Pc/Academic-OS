import { Language, EffortCategory } from '../types';
import { SortKey, Filters, FilterMode } from '../components/dashboard/ModulesOverviewControls';


// UI Preferences (from setup)
export function getTheme(): 'light' | 'dark' | 'system' {
  const theme = localStorage.getItem('theme');
  return theme === 'light' || theme === 'dark' || theme === 'system' ? theme : 'system';
}

export function setTheme(theme: 'light' | 'dark' | 'system'): void {
  localStorage.setItem('theme', theme);
}

export function getLanguage(): Language {
  const lang = localStorage.getItem('language');
  return lang === 'en' || lang === 'zu' || lang === 'af' || lang === 'xh' || lang === 'st' || lang === 'nso' ? lang as Language : 'en';
}

export function setLanguage(language: Language): void {
  localStorage.setItem('language', language);
}

export function getDueDateReminders(): boolean {
  return localStorage.getItem('dueDateReminders') === 'true';
}

export function setDueDateReminders(enabled: boolean): void {
  localStorage.setItem('dueDateReminders', enabled.toString());
}

export function getDefaultEffort(): EffortCategory {
  const effort = localStorage.getItem('defaultEffort');
  const validEfforts: EffortCategory[] = ['Quick Win', 'Standard', 'Deep Dive', 'Emergency Rescue', 'Group Project'];
  return validEfforts.includes(effort as EffortCategory) ? effort as EffortCategory : 'Standard';
}

export function setDefaultEffort(effort: EffortCategory): void {
  localStorage.setItem('defaultEffort', effort);
}

export function getDailyEffortCutline(): number | undefined {
  const cutline = localStorage.getItem('dailyEffortCutline');
  return cutline ? parseInt(cutline, 10) : undefined;
}

export function setDailyEffortCutline(cutline: number | undefined): void {
  if (cutline !== undefined) {
    localStorage.setItem('dailyEffortCutline', cutline.toString());
  } else {
    localStorage.removeItem('dailyEffortCutline');
  }
}

// Composite functions for SystemSettings
export function getSystemSettings() {
  return {
    theme: getTheme(),
    language: getLanguage(),
    dueDateReminders: getDueDateReminders(),
    defaultEffort: getDefaultEffort(),
    dailyEffortCutline: getDailyEffortCutline(),
  };
}

export function setSystemSettings(settings: {
  theme: 'light' | 'dark' | 'system';
  language: Language;
  dueDateReminders: boolean;
  defaultEffort: EffortCategory;
  dailyEffortCutline?: number;
}): void {
  setTheme(settings.theme);
  setLanguage(settings.language);
  setDueDateReminders(settings.dueDateReminders);
  setDefaultEffort(settings.defaultEffort);
  setDailyEffortCutline(settings.dailyEffortCutline);
}

// Session Metadata
export function getSchedulerTimestamp(): string | null {
  return localStorage.getItem('schedulerTimestamp');
}

export function setSchedulerTimestamp(timestamp: string): void {
  localStorage.setItem('schedulerTimestamp', timestamp);
}

// Setup completion flag
export function getSetupCompleteFlag(): string | null {
  return localStorage.getItem('setupComplete');
}

export function setSetupCompleteFlag(value: string): void {
  localStorage.setItem('setupComplete', value);
}

// New Dashboard Preferences
export interface DashboardPreferences {
    sortKey: SortKey;
    filters: Filters;
    isCompact: boolean;
    filterMode: FilterMode;
}

const DASHBOARD_PREFS_KEY = 'aos-dashboard-prefs';

export function getDashboardPreferences(): Partial<DashboardPreferences> {
    const prefsString = localStorage.getItem(DASHBOARD_PREFS_KEY);
    if (prefsString) {
        try {
            return JSON.parse(prefsString);
        } catch (e) {
            console.error("Could not parse dashboard preferences:", e);
            return {};
        }
    }
    return {};
}

export function setDashboardPreferences(prefs: Partial<DashboardPreferences>): void {
    localStorage.setItem(DASHBOARD_PREFS_KEY, JSON.stringify(prefs));
}