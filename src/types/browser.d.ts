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
}

export {};