import React, { useState, useEffect, useRef } from 'react';
import './popup.css';
import { NotionService, NotionConfig, BookmarkData } from '../services/notion';
import { StorageService, StorageSettings, TempSettings } from '../services/storage';

const Popup: React.FC = () => {
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [settings, setSettings] = useState<StorageSettings>({});
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [tempApiKey, setTempApiKey] = useState<string>('');
  const [tempPageId, setTempPageId] = useState<string>('');
  const [bookmarkTitle, setBookmarkTitle] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [bookmarkNotes, setBookmarkNotes] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [tempTags, setTempTags] = useState<string>('');
  
  // Refs for debouncing auto-save
  const apiKeyTimeoutRef = useRef<NodeJS.Timeout>();
  const pageIdTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Load settings and current URL
    const initializePopup = async () => {
      try {
        const [savedSettings, tempSettings] = await Promise.all([
          StorageService.getSettings(),
          StorageService.getTempSettings(),
          getCurrentTabUrl()
        ]);
        
        setSettings(savedSettings);
        // Prioritize temp settings over saved settings for input fields
        setTempApiKey(tempSettings.tempApiKey || savedSettings.notionApiKey || '');
        setTempPageId(tempSettings.tempPageId || savedSettings.notionPageId || '');
        
        // Show config if settings are missing
        if (!savedSettings.notionApiKey || !savedSettings.notionPageId) {
          setShowConfig(true);
        }
      } catch (error) {
        console.error('Error initializing popup:', error);
      } finally {
        setLoading(false);
      }
    };

    initializePopup();
    
    // Cleanup timeouts on unmount
    return () => {
      if (apiKeyTimeoutRef.current) {
        clearTimeout(apiKeyTimeoutRef.current);
      }
      if (pageIdTimeoutRef.current) {
        clearTimeout(pageIdTimeoutRef.current);
      }
    };
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

  // Auto-save temp settings with debouncing
  const autoSaveTempSettings = async (key: 'tempApiKey' | 'tempPageId', value: string) => {
    try {
      const currentTempSettings = await StorageService.getTempSettings();
      const updatedTempSettings = {
        ...currentTempSettings,
        [key]: value.trim()
      };
      await StorageService.saveTempSettings(updatedTempSettings);
    } catch (error) {
      console.error('Error auto-saving temp settings:', error);
    }
  };

  // Handle API key changes with auto-save
  const handleApiKeyChange = (value: string) => {
    setTempApiKey(value);
    
    // Clear existing timeout
    if (apiKeyTimeoutRef.current) {
      clearTimeout(apiKeyTimeoutRef.current);
    }
    
    // Debounce auto-save by 500ms
    apiKeyTimeoutRef.current = setTimeout(() => {
      autoSaveTempSettings('tempApiKey', value);
    }, 500);
  };

  // Handle page ID changes with auto-save
  const handlePageIdChange = (value: string) => {
    setTempPageId(value);
    
    // Clear existing timeout
    if (pageIdTimeoutRef.current) {
      clearTimeout(pageIdTimeoutRef.current);
    }
    
    // Debounce auto-save by 500ms
    pageIdTimeoutRef.current = setTimeout(() => {
      autoSaveTempSettings('tempPageId', value);
    }, 500);
  };

  // Handle paste events for immediate save
  const handleApiKeyPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    // Get pasted content
    const pastedText = e.clipboardData.getData('text');
    const newValue = e.currentTarget.value + pastedText;
    
    // Clear timeout if exists
    if (apiKeyTimeoutRef.current) {
      clearTimeout(apiKeyTimeoutRef.current);
    }
    
    // Save immediately on paste
    setTimeout(() => {
      autoSaveTempSettings('tempApiKey', newValue);
    }, 100);
  };

  const handlePageIdPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    // Get pasted content
    const pastedText = e.clipboardData.getData('text');
    const newValue = e.currentTarget.value + pastedText;
    
    // Clear timeout if exists
    if (pageIdTimeoutRef.current) {
      clearTimeout(pageIdTimeoutRef.current);
    }
    
    // Save immediately on paste
    setTimeout(() => {
      autoSaveTempSettings('tempPageId', newValue);
    }, 100);
  };

  const handleSaveConfig = async () => {
    if (!tempApiKey.trim() || !tempPageId.trim()) {
      showMessage('error', 'Please fill in both API key and Page ID');
      return;
    }

    try {
      const newSettings: StorageSettings = {
        notionApiKey: tempApiKey.trim(),
        notionPageId: tempPageId.trim(),
        availableTags: settings.availableTags || []
      };

      // Test the connection before saving
      const notionService = new NotionService({
        apiKey: newSettings.notionApiKey!,
        pageId: newSettings.notionPageId!
      });

      setSaving(true);
      const testResult = await notionService.testConnection();
      
      if (!testResult.success) {
        showMessage('error', `Connection failed: ${testResult.error}`);
        return;
      }

      await StorageService.saveSettings(newSettings);
      // Clear temp settings since they're now saved permanently
      await StorageService.clearTempSettings();
      setSettings(newSettings);
      setShowConfig(false);
      showMessage('success', 'Configuration saved successfully!');
    } catch (error) {
      showMessage('error', 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleAddTag = async () => {
    const newTag = tempTags.trim();
    if (!newTag) return;

    const currentTags = settings.availableTags || [];
    if (currentTags.includes(newTag)) {
      showMessage('error', 'Tag already exists');
      return;
    }

    const updatedSettings = {
      ...settings,
      availableTags: [...currentTags, newTag]
    };

    try {
      await StorageService.saveSettings(updatedSettings);
      setSettings(updatedSettings);
      setTempTags('');
      showMessage('success', 'Tag added successfully!');
    } catch (error) {
      showMessage('error', 'Failed to add tag');
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    const currentTags = settings.availableTags || [];
    const updatedSettings = {
      ...settings,
      availableTags: currentTags.filter(tag => tag !== tagToRemove)
    };

    try {
      await StorageService.saveSettings(updatedSettings);
      setSettings(updatedSettings);
      // Also remove from selected tags if it was selected
      setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove));
      showMessage('success', 'Tag removed successfully!');
    } catch (error) {
      showMessage('error', 'Failed to remove tag');
    }
  };

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSaveBookmark = async () => {
    if (!settings.notionApiKey || !settings.notionPageId) {
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
        pageId: settings.notionPageId
      });

      const bookmarkData: BookmarkData = {
        url: currentUrl,
        title: bookmarkTitle.trim() || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        notes: bookmarkNotes.trim() || undefined
      };

      const result = await notionService.saveBookmark(bookmarkData);
      
      if (result.success) {
        showMessage('success', 'Bookmark saved to Notion!');
        setBookmarkNotes(''); // Clear notes after successful save
        setSelectedTags([]); // Clear tags after successful save
      } else {
        showMessage('error', `Failed to save: ${result.error}`);
      }
    } catch (error) {
      showMessage('error', 'Failed to save bookmark');
    } finally {
      setSaving(false);
    }
  };

  const isConfigured = settings.notionApiKey && settings.notionPageId;

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
                    onChange={(e) => handleApiKeyChange(e.target.value)}
                    onPaste={handleApiKeyPaste}
                    placeholder="secret_xxxxx..."
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="pageId">Page ID:</label>
                  <input
                    id="pageId"
                    type="text"
                    value={tempPageId}
                    onChange={(e) => handlePageIdChange(e.target.value)}
                    onPaste={handlePageIdPaste}
                    placeholder="32-character page ID"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="tags">Available Tags:</label>
                  <div className="tags-input-container">
                    <input
                      id="tags"
                      type="text"
                      value={tempTags}
                      onChange={(e) => setTempTags(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      placeholder="Add a new tag..."
                      className="form-input"
                    />
                    <button 
                      onClick={handleAddTag}
                      type="button"
                      className="btn btn-secondary btn-add-tag"
                    >
                      Add
                    </button>
                  </div>
                  {settings.availableTags && settings.availableTags.length > 0 && (
                    <div className="tags-list">
                      {settings.availableTags.map(tag => (
                        <div key={tag} className="tag-item">
                          <span className="tag-name">{tag}</span>
                          <button 
                            onClick={() => handleRemoveTag(tag)}
                            className="btn-remove-tag"
                            type="button"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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
                    {settings.availableTags && settings.availableTags.length > 0 && (
                      <div className="form-group">
                        <label htmlFor="tags">Tags (optional):</label>
                        <div className="tags-select">
                          {settings.availableTags.map(tag => (
                            <label key={tag} className="tag-checkbox">
                              <input
                                type="checkbox"
                                checked={selectedTags.includes(tag)}
                                onChange={() => handleToggleTag(tag)}
                              />
                              <span className="tag-label">{tag}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
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