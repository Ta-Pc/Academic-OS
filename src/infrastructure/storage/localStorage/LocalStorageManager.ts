import { z } from 'zod';

interface StorageMetadata<T> {
  version: number;
  payload: T;
}

export class LocalStorageManager {
  private static instance: LocalStorageManager;
  private currentVersion = 1;

  private constructor() {}

  public static getInstance(): LocalStorageManager {
    if (!LocalStorageManager.instance) {
      LocalStorageManager.instance = new LocalStorageManager();
    }
    return LocalStorageManager.instance;
  }

  public get<T>(key: string, schema: z.ZodSchema<T>): T | null {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      const parsed: unknown = JSON.parse(item);
      const metadataSchema = z.object({
        version: z.number(),
        payload: schema,
      });

      const validated = metadataSchema.parse(parsed);
      return validated.payload;
    } catch (error) {
      console.error(`Failed to retrieve or validate item for key "${key}":`, error);
      return null;
    }
  }

  public set<T>(key: string, value: T): void {
    try {
      const metadata: StorageMetadata<T> = {
        version: this.currentVersion,
        payload: value,
      };
      localStorage.setItem(key, JSON.stringify(metadata));
    } catch (error) {
      console.error(`Failed to store item for key "${key}":`, error);
    }
  }

  public remove(key: string): void {
    localStorage.removeItem(key);
  }

  public clear(): void {
    localStorage.clear();
  }
}
