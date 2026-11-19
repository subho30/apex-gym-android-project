import { Preferences } from '@capacitor/preferences';

export class StorageService {
  static async get<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const { value } = await Preferences.get({ key });
      if (value !== null && value !== undefined) {
        return JSON.parse(value) as T;
      }
    } catch {
      // Fallback for environments where Capacitor Preferences encounters errors
      if (typeof window !== 'undefined' && window.localStorage) {
        const item = window.localStorage.getItem(key);
        if (item !== null) {
          try {
            return JSON.parse(item) as T;
          } catch {
            // ignore JSON parse error
          }
        }
      }
    }
    return defaultValue;
  }

  static async set<T>(key: string, value: T): Promise<void> {
    const stringified = JSON.stringify(value);
    try {
      await Preferences.set({ key, value: stringified });
    } catch {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, stringified);
      }
    }
  }

  static async remove(key: string): Promise<void> {
    try {
      await Preferences.remove({ key });
    } catch {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    }
  }

  static async clear(): Promise<void> {
    try {
      await Preferences.clear();
    } catch {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.clear();
      }
    }
  }
}
