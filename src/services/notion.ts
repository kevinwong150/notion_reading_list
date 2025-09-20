// Notion API service for managing bookmarks
export interface NotionConfig {
  apiKey: string;
  pageId: string;
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
  private pageId: string;

  constructor(config: NotionConfig) {
    this.apiKey = config.apiKey;
    this.pageId = config.pageId;
  }

  async saveBookmark(bookmark: BookmarkData): Promise<NotionResponse> {
    try {
      // Create blocks according to the specified format:
      // 1. Empty line separator
      // 2. Timestamp with @now format - notion built-in @now tag
      // 3. Title - Displays page title
      // 4. Bookmark URL - The actual bookmark block for the saved URL
      // 5. Notes - if notes provided, display notes, otherwise ignore this line
      
      const children = [];
      
      // 1. Add empty line separator
      children.push({
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: ''
              }
            }
          ]
        }
      });
      
      // 2. Add @now timestamp using Notion's built-in @now format
      children.push({
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: '@now'
              }
            }
          ]
        }
      });
      
      // 3. Add Title - always display if available
      if (bookmark.title && bookmark.title.trim()) {
        children.push({
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: bookmark.title.trim()
                }
              }
            ]
          }
        });
      }
      
      // 4. Add the bookmark URL
      const bookmarkBlock = {
        type: 'bookmark',
        bookmark: {
          url: bookmark.url
        }
      };
      children.push(bookmarkBlock);
      
      // 5. Add Notes - only if notes are provided
      if (bookmark.notes && bookmark.notes.trim()) {
        children.push({
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: bookmark.notes.trim()
                }
              }
            ]
          }
        });
      }

      const response = await fetch(`https://api.notion.com/v1/blocks/${this.pageId}/children`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28'
        },
        body: JSON.stringify({
          children: children
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
        pageId: this.pageId
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
      const response = await fetch(`https://api.notion.com/v1/pages/${this.pageId}`, {
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