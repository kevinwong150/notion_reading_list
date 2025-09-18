// Notion API service for managing bookmarks
export interface NotionConfig {
  apiKey: string;
  databaseId: string;
}

export interface BookmarkData {
  url: string;
  title?: string;
  notes?: string;
}

export interface NotionResponse {
  success: boolean;
  error?: string;
  pageId?: string;
}

export class NotionService {
  private apiKey: string;
  private databaseId: string;

  constructor(config: NotionConfig) {
    this.apiKey = config.apiKey;
    this.databaseId = config.databaseId;
  }

  async saveBookmark(bookmark: BookmarkData): Promise<NotionResponse> {
    try {
      const response = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28'
        },
        body: JSON.stringify({
          parent: {
            database_id: this.databaseId
          },
          properties: {
            Name: {
              title: [
                {
                  text: {
                    content: bookmark.title || bookmark.url
                  }
                }
              ]
            },
            URL: {
              url: bookmark.url
            },
            Notes: {
              rich_text: [
                {
                  text: {
                    content: bookmark.notes || ''
                  }
                }
              ]
            }
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.message || `HTTP ${response.status}: ${response.statusText}`
        };
      }

      const data = await response.json();
      return {
        success: true,
        pageId: data.id
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async testConnection(): Promise<NotionResponse> {
    try {
      const response = await fetch(`https://api.notion.com/v1/databases/${this.databaseId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.message || `HTTP ${response.status}: ${response.statusText}`
        };
      }

      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }
}