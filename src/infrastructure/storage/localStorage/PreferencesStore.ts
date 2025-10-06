import { z } from 'zod';
import { LocalStorageManager } from './LocalStorageManager';

type Language = 'en' | 'zu' | 'af' | 'xh' | 'st' | 'nso';

const preferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  language: z.enum(['en', 'zu', 'af', 'xh', 'st', 'nso']),
});

type Preferences = z.infer<typeof preferencesSchema>;

export class PreferencesStore {
  private static instance: PreferencesStore;
  private storageManager = LocalStorageManager.getInstance();
  private readonly key = 'user-preferences';

  private constructor() {}

  public static getInstance(): PreferencesStore {
    if (!PreferencesStore.instance) {
      PreferencesStore.instance = new PreferencesStore();
    }
    return PreferencesStore.instance;
  }

  public getPreferences(): Preferences | null {
    return this.storageManager.get(this.key, preferencesSchema);
  }

  public setPreferences(preferences: Preferences): void {
    this.storageManager.set(this.key, preferences);
  }

  public getTheme(): 'light' | 'dark' | 'system' {
    const prefs = this.getPreferences();
    return prefs?.theme ?? 'system';
  }

  public setTheme(theme: 'light' | 'dark' | 'system'): void {
    const prefs = this.getPreferences() ?? { theme, language: 'en' as Language };
    prefs.theme = theme;
    this.setPreferences(prefs);
  }

  public getLanguage(): Language {
    const prefs = this.getPreferences();
    return prefs?.language ?? 'en';
  }

  public setLanguage(language: Language): void {
    const prefs = this.getPreferences() ?? { theme: 'system' as const, language };
    prefs.language = language;
    this.setPreferences(prefs);
  }
}
