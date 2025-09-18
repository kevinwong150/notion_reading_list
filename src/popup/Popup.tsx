import React, { useState, useEffect } from 'react';
import './popup.css';
import { NotionService, NotionConfig, BookmarkData } from '../services/notion';
import { StorageService, StorageSettings } from '../services/storage';

const Popup: React.FC = () => {
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [settings, setSettings] = useState<StorageSettings>({});
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [tempApiKey, setTempApiKey] = useState<string>('');
  const [tempDatabaseId, setTempDatabaseId] = useState<string>('');
  const [bookmarkTitle, setBookmarkTitle] = useState<string>('');
  const [bookmarkNotes, setBookmarkNotes] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    // Load settings and current URL
    const initializePopup = async () => {
      try {
        const [savedSettings] = await Promise.all([
          StorageService.getSettings(),
          getCurrentTabUrl()
        ]);
        
        setSettings(savedSettings);
        setTempApiKey(savedSettings.notionApiKey || '');
        setTempDatabaseId(savedSettings.notionDatabaseId || '');
        
        // Show config if settings are missing
        if (!savedSettings.notionApiKey || !savedSettings.notionDatabaseId) {
          setShowConfig(true);
        }
      } catch (error) {
        console.error('Error initializing popup:', error);
      } finally {
        setLoading(false);
      }
    };

    initializePopup();
  }, []);

  const getCurrentTabUrl = async () => {
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
        
        const url = tabs[0]?.url || 'No URL found';
        const title = tabs[0]?.title || '';
        setCurrentUrl(url);
        setBookmarkTitle(title);
      } else {
        setCurrentUrl('Browser API not available - please install as extension');
      }
    } catch (error) {
      console.error('Error getting current tab URL:', error);
      setCurrentUrl('Error getting URL');
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleSaveConfig = async () => {
    if (!tempApiKey.trim() || !tempDatabaseId.trim()) {
      showMessage('error', 'Please fill in both API key and Database ID');
      return;
    }

    try {
      const newSettings: StorageSettings = {
        notionApiKey: tempApiKey.trim(),
        notionDatabaseId: tempDatabaseId.trim()
      };

      // Test the connection before saving
      const notionService = new NotionService({
        apiKey: newSettings.notionApiKey!,
        databaseId: newSettings.notionDatabaseId!
      });

      setSaving(true);
      const testResult = await notionService.testConnection();
      
      if (!testResult.success) {
        showMessage('error', `Connection failed: ${testResult.error}`);
        return;
      }

      await StorageService.saveSettings(newSettings);
      setSettings(newSettings);
      setShowConfig(false);
      showMessage('success', 'Configuration saved successfully!');
    } catch (error) {
      showMessage('error', 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBookmark = async () => {
    if (!settings.notionApiKey || !settings.notionDatabaseId) {
      showMessage('error', 'Please configure Notion settings first');
      setShowConfig(true);
      return;
    }

    if (!currentUrl || currentUrl.includes('Error') || currentUrl.includes('No URL')) {
      showMessage('error', 'No valid URL to save');
      return;
    }

    try {
      setSaving(true);
      
      const notionService = new NotionService({
        apiKey: settings.notionApiKey,
        databaseId: settings.notionDatabaseId
      });

      const bookmarkData: BookmarkData = {
        url: currentUrl,
        title: bookmarkTitle.trim() || undefined,
        notes: bookmarkNotes.trim() || undefined
      };

      const result = await notionService.saveBookmark(bookmarkData);
      
      if (result.success) {
        showMessage('success', 'Bookmark saved to Notion!');
        setBookmarkNotes(''); // Clear notes after successful save
      } else {
        showMessage('error', `Failed to save: ${result.error}`);
      }
    } catch (error) {
      showMessage('error', 'Failed to save bookmark');
    } finally {
      setSaving(false);
    }
  };

  const isConfigured = settings.notionApiKey && settings.notionDatabaseId;

  return (
    <div className="popup-container">
      <h2 className="popup-title">Notion Reading List</h2>
      
      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="content">
        {loading ? (
          <p className="loading">Loading...</p>
        ) : (
          <>
            {showConfig ? (
              <div className="config-section">
                <h3>Notion Configuration</h3>
                <div className="form-group">
                  <label htmlFor="apiKey">Notion API Key:</label>
                  <input
                    id="apiKey"
                    type="password"
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    placeholder="secret_xxxxx..."
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="databaseId">Database ID:</label>
                  <input
                    id="databaseId"
                    type="text"
                    value={tempDatabaseId}
                    onChange={(e) => setTempDatabaseId(e.target.value)}
                    placeholder="32-character database ID"
                    className="form-input"
                  />
                </div>
                <div className="button-group">
                  <button 
                    onClick={handleSaveConfig}
                    disabled={saving}
                    className="btn btn-primary"
                  >
                    {saving ? 'Testing...' : 'Save & Test'}
                  </button>
                  {isConfigured && (
                    <button 
                      onClick={() => setShowConfig(false)}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="url-section">
                  <h3>Current URL:</h3>
                  <p className="current-url">{currentUrl}</p>
                </div>

                {isConfigured && !currentUrl.includes('Error') && !currentUrl.includes('No URL') && (
                  <div className="bookmark-section">
                    <div className="form-group">
                      <label htmlFor="title">Title (optional):</label>
                      <input
                        id="title"
                        type="text"
                        value={bookmarkTitle}
                        onChange={(e) => setBookmarkTitle(e.target.value)}
                        placeholder="Custom title for this bookmark"
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="notes">Notes (optional):</label>
                      <textarea
                        id="notes"
                        value={bookmarkNotes}
                        onChange={(e) => setBookmarkNotes(e.target.value)}
                        placeholder="Add some notes about this page..."
                        className="form-textarea"
                        rows={3}
                      />
                    </div>
                    <button 
                      onClick={handleSaveBookmark}
                      disabled={saving}
                      className="btn btn-primary btn-save"
                    >
                      {saving ? 'Saving...' : 'Save to Notion'}
                    </button>
                  </div>
                )}

                <div className="settings-link">
                  <button 
                    onClick={() => setShowConfig(true)}
                    className="btn btn-link"
                  >
                    {isConfigured ? '⚙️ Settings' : '⚙️ Configure Notion'}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Popup;