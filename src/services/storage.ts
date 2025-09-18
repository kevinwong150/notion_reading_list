// Storage service for managing extension settings
export interface StorageSettings {
  notionApiKey?: string;
  notionPageId?: string;
}

export class StorageService {
  private static readonly STORAGE_KEY = 'notion_reading_list_settings';

  static async getSettings(): Promise<StorageSettings> {
    try {
      // Try chrome.storage first (extension context)
      if (typeof chrome !== 'undefined' && chrome.storage) {
        return new Promise((resolve) => {
          chrome.storage.local.get([this.STORAGE_KEY], (result) => {
            resolve(result[this.STORAGE_KEY] || {});
          });
        });
      }
      
      // Fallback to localStorage (web context)
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error loading settings:', error);
      return {};
    }
  }

  static async saveSettings(settings: StorageSettings): Promise<void> {
    try {
      // Try chrome.storage first (extension context)
      if (typeof chrome !== 'undefined' && chrome.storage) {
        return new Promise((resolve, reject) => {
          chrome.storage.local.set({ [this.STORAGE_KEY]: settings }, () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve();
            }
          });
        });
      }
      
      // Fallback to localStorage (web context)
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }

  static async clearSettings(): Promise<void> {
    try {
      // Try chrome.storage first (extension context)
      if (typeof chrome !== 'undefined' && chrome.storage) {
        return new Promise((resolve, reject) => {
          chrome.storage.local.remove([this.STORAGE_KEY], () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve();
            }
          });
        });
      }
      
      // Fallback to localStorage (web context)
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing settings:', error);
      throw error;
    }
  }
}