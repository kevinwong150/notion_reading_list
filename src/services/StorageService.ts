export interface UserSettings {
  notionApiKey: string;
  notionPageId: string;
}

export class StorageService {
  private static readonly SETTINGS_KEY = 'notion_extension_settings';

  static async getSettings(): Promise<UserSettings | null> {
    try {
      // Check if we're in a browser extension context
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.sync.get(this.SETTINGS_KEY);
        return result[this.SETTINGS_KEY] || null;
      }
      return null;
    } catch (error) {
      console.error('Error getting settings:', error);
      return null;
    }
  }

  static async saveSettings(settings: UserSettings): Promise<boolean> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.sync.set({ [this.SETTINGS_KEY]: settings });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving settings:', error);
      return false;
    }
  }

  static async clearSettings(): Promise<boolean> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.sync.remove(this.SETTINGS_KEY);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error clearing settings:', error);
      return false;
    }
  }
}