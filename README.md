# Notion Reading List

A browser extension that captures the current tab's URL and displays it in a popup. Built with React and TypeScript.

## Features

- ✅ Shows a popup when extension button is clicked
- ✅ Displays placeholder text
- ✅ Captures and shows the current active tab's URL
- ✅ Compatible with both Chrome and Firefox

## Development

### Prerequisites

- Node.js (v14 or higher)
- yarn

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   yarn install
   ```

3. Build the extension:
   ```bash
   # For Chrome (Manifest v3)
   yarn build:chrome
   
   # For Firefox (Manifest v2)
   yarn build:firefox
   ```

### Installing the Extension

#### Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the `dist` folder
4. The extension icon should appear in your toolbar

#### Firefox

1. Open Firefox and navigate to `about:debugging`
2. Click "This Firefox"
3. Click "Load Temporary Add-on"
4. Navigate to the `dist` folder and select `manifest.json`
5. The extension icon should appear in your toolbar

### Using the Extension

1. Click the extension icon in your browser toolbar
2. A popup will appear showing:
   - "Placeholder" text
   - The current tab's URL

## Project Structure

```
src/
├── popup/
│   ├── index.tsx      # Entry point for popup
│   ├── Popup.tsx      # Main popup component
│   ├── popup.css      # Popup styles
│   └── popup.html     # Popup HTML template
├── types/
│   └── browser.d.ts   # TypeScript definitions
public/
├── manifest.json      # Chrome extension manifest (v3)
├── manifest-firefox.json # Firefox addon manifest (v2)
└── icons/             # Extension icons
```

## Build Scripts

- `yarn build` - Build for production (Chrome by default)
- `yarn build:chrome` - Build specifically for Chrome
- `yarn build:firefox` - Build specifically for Firefox
- `yarn dev` - Build for development
- `yarn watch` - Watch for changes and rebuild