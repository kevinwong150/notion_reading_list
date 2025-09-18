// Type definitions for browser extension APIs
declare global {
  interface Window {
    chrome?: typeof chrome;
    browser?: typeof browser;
  }
}

// Chrome extension API types
declare namespace chrome {
  namespace tabs {
    interface Tab {
      id?: number;
      url?: string;
      title?: string;
      active?: boolean;
      windowId?: number;
    }

    function query(
      queryInfo: { active?: boolean; currentWindow?: boolean },
      callback?: (result: Tab[]) => void
    ): Promise<Tab[]>;
  }

  namespace storage {
    interface StorageArea {
      get(keys?: string | string[] | { [key: string]: any }): Promise<{ [key: string]: any }>;
      set(items: { [key: string]: any }): Promise<void>;
      remove(keys: string | string[]): Promise<void>;
      clear(): Promise<void>;
    }

    const sync: StorageArea;
    const local: StorageArea;
  }

  namespace runtime {
    const lastError: { message: string } | undefined;
  }
}

// Firefox addon API types (WebExtensions)
declare namespace browser {
  namespace tabs {
    interface Tab {
      id?: number;
      url?: string;
      title?: string;
      active?: boolean;
      windowId?: number;
    }

    function query(queryInfo: { active?: boolean; currentWindow?: boolean }): Promise<Tab[]>;
  }

  namespace storage {
    interface StorageArea {
      get(keys?: string | string[] | { [key: string]: any }): Promise<{ [key: string]: any }>;
      set(items: { [key: string]: any }): Promise<void>;
      remove(keys: string | string[]): Promise<void>;
      clear(): Promise<void>;
    }

    const sync: StorageArea;
    const local: StorageArea;
  }
}

export {};