import React, { useState, useEffect } from 'react';
import './popup.css';
import { StorageService, UserSettings } from '../services/StorageService';
import { NotionService, BookmarkData } from '../services/NotionService';

const Popup: React.FC = () => {
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [currentTitle, setCurrentTitle] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [pageId, setPageId] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  const notionService = new NotionService();

  useEffect(() => {
    // Get the current active tab URL and title
    const getCurrentTabInfo = async () => {
      try {
        // Check if we're in a browser extension context
        if (typeof chrome !== 'undefined' && chrome.tabs) {
          // Use Chrome extension API with promise wrapper
          const tabs = await new Promise<chrome.tabs.Tab[]>((resolve, reject) => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
              } else {
                resolve(tabs);
              }
            });
          });
          setCurrentUrl(tabs[0]?.url || 'No URL found');
          setCurrentTitle(tabs[0]?.title || 'No title found');
        } else {
          setCurrentUrl('Browser API not available - please install as extension');
          setCurrentTitle('Extension Context Required');
        }
      } catch (error) {
        console.error('Error getting current tab info:', error);
        setCurrentUrl('Error getting URL');
        setCurrentTitle('Error getting title');
      } finally {
        setLoading(false);
      }
    };

    // Load saved settings
    const loadSettings = async () => {
      const savedSettings = await StorageService.getSettings();
      setSettings(savedSettings);
      if (savedSettings) {
        setApiKey(savedSettings.notionApiKey);
        setPageId(savedSettings.notionPageId);
      }
    };

    getCurrentTabInfo();
    loadSettings();
  }, []);

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 3000);
  };

  const handleSaveSettings = async () => {
    if (!apiKey.trim() || !pageId.trim()) {
      showMessage('Please provide both API key and Page ID', 'error');
      return;
    }

    setSaving(true);
    
    // Test connection first
    const isValidConnection = await notionService.testConnection(apiKey.trim(), pageId.trim());
    
    if (!isValidConnection) {
      showMessage('Failed to connect to Notion. Please check your API key and Page ID.', 'error');
      setSaving(false);
      return;
    }

    const newSettings: UserSettings = {
      notionApiKey: apiKey.trim(),
      notionPageId: pageId.trim(),
    };

    const saved = await StorageService.saveSettings(newSettings);
    
    if (saved) {
      setSettings(newSettings);
      setShowSettings(false);
      showMessage('Settings saved successfully!', 'success');
    } else {
      showMessage('Failed to save settings', 'error');
    }
    
    setSaving(false);
  };

  const handleAddBookmark = async () => {
    if (!settings) {
      setShowSettings(true);
      showMessage('Please configure your Notion settings first', 'error');
      return;
    }

    if (!currentUrl || currentUrl.includes('Error') || currentUrl.includes('Browser API not available')) {
      showMessage('Cannot bookmark this page - invalid URL', 'error');
      return;
    }

    // Check if URL is a valid web URL
    try {
      const url = new URL(currentUrl);
      if (!['http:', 'https:'].includes(url.protocol)) {
        showMessage('Can only bookmark web pages (http/https URLs)', 'error');
        return;
      }
    } catch {
      showMessage('Invalid URL format', 'error');
      return;
    }

    setSaving(true);

    const bookmarkData: BookmarkData = {
      url: currentUrl,
      title: currentTitle !== 'No title found' && currentTitle !== 'Extension Context Required' ? currentTitle : undefined,
    };

    const success = await notionService.appendBookmarkToPage(
      settings.notionApiKey,
      settings.notionPageId,
      bookmarkData
    );

    if (success) {
      showMessage(`✅ "${currentTitle}" bookmarked successfully!`, 'success');
    } else {
      showMessage('Failed to add bookmark. Please check your settings.', 'error');
    }

    setSaving(false);
  };

  const handleClearSettings = async () => {
    const cleared = await StorageService.clearSettings();
    if (cleared) {
      setSettings(null);
      setApiKey('');
      setPageId('');
      setShowSettings(false);
      showMessage('Settings cleared', 'success');
    }
  };

  if (showSettings) {
    return (
      <div className="popup-container">
        <div className="settings-header">
          <h2 className="popup-title">Notion Settings</h2>
          <button 
            className="close-settings-btn"
            onClick={() => setShowSettings(false)}
            title="Close settings"
          >
            ✕
          </button>
        </div>
        
        <div className="settings-content">
          <div className="form-group">
            <label htmlFor="apiKey">Notion API Key:</label>
            <input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="secret_..."
              className="settings-input"
            />
            <p className="help-text">
              Create an integration at{' '}
              <a href="https://notion.so/my-integrations" target="_blank" rel="noopener noreferrer">
                notion.so/my-integrations
              </a>
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="pageId">Notion Page ID:</label>
            <input
              id="pageId"
              type="text"
              value={pageId}
              onChange={(e) => setPageId(e.target.value)}
              placeholder="32-character page ID"
              className="settings-input"
            />
            <p className="help-text">
              Copy page ID from the Notion page URL (32 characters after the last dash)
            </p>
          </div>

          <div className="settings-actions">
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="save-btn"
            >
              {saving ? 'Testing & Saving...' : 'Save Settings'}
            </button>
            
            {settings && (
              <button
                onClick={handleClearSettings}
                className="clear-btn"
              >
                Clear Settings
              </button>
            )}
          </div>
        </div>

        {message && (
          <div className={`message ${messageType}`}>
            {message}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="popup-container">
      <div className="header">
        <h2 className="popup-title">Notion Reading List</h2>
        <button 
          className="settings-btn"
          onClick={() => setShowSettings(true)}
          title="Settings"
        >
          ⚙️
        </button>
      </div>
      
      <div className="content">
        {loading ? (
          <p className="loading">Loading current page...</p>
        ) : (
          <div className="page-info">
            <div className="url-section">
              <h3>Current Page:</h3>
              <p className="current-title">{currentTitle}</p>
              <p className="current-url">{currentUrl}</p>
            </div>

            {settings ? (
              <div className="bookmark-section">
                <button
                  onClick={handleAddBookmark}
                  disabled={saving || !currentUrl || currentUrl.includes('Error')}
                  className="bookmark-btn"
                >
                  {saving ? 'Adding...' : 'Add to Notion Page'}
                </button>
              </div>
            ) : (
              <div className="setup-prompt">
                <p>Configure your Notion settings to start bookmarking pages.</p>
                <button
                  onClick={() => setShowSettings(true)}
                  className="setup-btn"
                >
                  Set up Notion
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {message && (
        <div className={`message ${messageType}`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default Popup;