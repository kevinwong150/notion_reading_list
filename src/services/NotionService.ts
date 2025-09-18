export interface BookmarkData {
  url: string;
  title?: string;
}

export class NotionService {
  private readonly NOTION_API_URL = 'https://api.notion.com/v1';
  private readonly NOTION_VERSION = '2022-06-28';

  /**
   * Test connection to Notion API with given credentials
   */
  async testConnection(apiKey: string, pageId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.NOTION_API_URL}/pages/${pageId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Notion-Version': this.NOTION_VERSION,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Notion connection test failed:', error);
      return false;
    }
  }

  /**
   * Append a bookmark block to a Notion page
   */
  async appendBookmarkToPage(
    apiKey: string,
    pageId: string,
    bookmarkData: BookmarkData
  ): Promise<boolean> {
    try {
      const bookmarkBlock = {
        object: 'block',
        type: 'bookmark',
        bookmark: {
          url: bookmarkData.url,
          caption: bookmarkData.title ? [
            {
              type: 'text',
              text: {
                content: bookmarkData.title,
              },
            },
          ] : [],
        },
      };

      const response = await fetch(`${this.NOTION_API_URL}/blocks/${pageId}/children`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Notion-Version': this.NOTION_VERSION,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          children: [bookmarkBlock],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to append bookmark:', response.status, errorText);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error appending bookmark:', error);
      return false;
    }
  }

  /**
   * Get page title for display purposes
   */
  async getPageTitle(apiKey: string, pageId: string): Promise<string | null> {
    try {
      const response = await fetch(`${this.NOTION_API_URL}/pages/${pageId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Notion-Version': this.NOTION_VERSION,
        },
      });

      if (!response.ok) {
        return null;
      }

      const page = await response.json();
      
      // Extract page title from properties
      if (page.properties && page.properties.title) {
        const titleProperty = page.properties.title;
        if (titleProperty.title && titleProperty.title.length > 0) {
          return titleProperty.title[0].text.content;
        }
      }

      // Fallback to checking parent if it's a database page
      if (page.parent && page.parent.type === 'database_id') {
        return 'Database Page';
      }

      return 'Untitled Page';
    } catch (error) {
      console.error('Error getting page title:', error);
      return null;
    }
  }
}