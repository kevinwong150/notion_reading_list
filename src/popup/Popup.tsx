import React, { useState, useEffect } from 'react';
import './popup.css';

const Popup: React.FC = () => {
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Get the current active tab URL
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
          setCurrentUrl(tabs[0]?.url || 'No URL found');
        } else {
          setCurrentUrl('Browser API not available - please install as extension');
        }
      } catch (error) {
        console.error('Error getting current tab URL:', error);
        setCurrentUrl('Error getting URL');
      } finally {
        setLoading(false);
      }
    };

    getCurrentTabUrl();
  }, []);

  return (
    <div className="popup-container">
      <h2 className="popup-title">Notion Reading List</h2>
      <div className="content">
        <p className="placeholder-text">Placeholder</p>
        {loading ? (
          <p className="loading">Loading current URL...</p>
        ) : (
          <div className="url-section">
            <h3>Current URL:</h3>
            <p className="current-url">{currentUrl}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Popup;