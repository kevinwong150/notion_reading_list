# Notion Reading List

A browser extension that captures the current tab's URL and displays it in a popup. Built with React and TypeScript.

## Features

- ✅ Shows a popup when extension button is clicked
- ✅ Displays placeholder text
- ✅ Captures and shows the current active tab's URL
- ✅ Compatible with both Chrome and Firefox
- ✅ Docker support for development and production

## Development

### Prerequisites

- Node.js (v14 or higher)
- npm
- Docker (optional, for containerized development)

### Setup

#### Traditional Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   # For Chrome (Manifest v3)
   npm run build:chrome
   
   # For Firefox (Manifest v2)
   npm run build:firefox
   ```

#### Docker Setup

This repository includes Docker support for both development and production environments.

##### Development with Docker

1. **Using Docker Compose (Recommended)**:
   ```bash
   # Start development environment with hot reloading
   docker-compose up dev
   ```
   This will:
   - Install dependencies
   - Start webpack in watch mode
   - Mount your local code for live reloading
   - Make changes appear automatically in the `dist/` folder

2. **Using Docker directly**:
   ```bash
   # Build development image
   docker build -f Dockerfile.dev -t notion-reading-list-dev .
   
   # Run development container
   docker run -p 3000:3000 -v $(pwd):/app -v /app/node_modules notion-reading-list-dev
   ```

##### Production with Docker

1. **Build the extension locally first**:
   ```bash
   npm run build
   ```

2. **Build and run production Docker image**:
   ```bash
   # Build production image
   docker build -t notion-reading-list .
   
   # Run production container
   docker run -p 8080:80 notion-reading-list
   ```

3. **Using Docker Compose**:
   ```bash
   # Build the extension and run production server
   npm run build
   docker-compose up prod
   ```

4. **Using npm scripts**:
   ```bash
   # Build Docker image
   npm run docker:build-image
   
   # Run container
   npm run docker:run
   ```

#### How Docker Works for This Project

The Docker setup provides two main environments:

1. **Development Environment** (`Dockerfile.dev`):
   - Based on Node.js Alpine image
   - Installs all dependencies
   - Runs `npm run watch` to continuously build changes
   - Mounts local source code for live development
   - Ideal for development workflow

2. **Production Environment** (`Dockerfile`):
   - Based on Nginx Alpine image
   - Serves pre-built extension files
   - Optimized for serving static files
   - Includes proper headers for browser extension compatibility
   - Much smaller image size (~15MB vs ~400MB for dev)

**Benefits of Docker approach**:
- ✅ Consistent development environment across machines
- ✅ No need to install Node.js locally
- ✅ Isolated dependencies
- ✅ Production-ready deployment
- ✅ Easy CI/CD integration
- ✅ Web-based testing of extension popup

**Accessing the Extension**:
- Development: Files built to `dist/` folder, watch for changes
- Production: Browse to `http://localhost:8080/popup.html` to see the extension popup in a web browser
- The Docker production setup serves the extension as a web app for testing purposes

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
docker/
├── Dockerfile         # Production Docker image
├── Dockerfile.dev     # Development Docker image
└── docker-compose.yml # Docker Compose configuration
```

## Build Scripts

- `npm run build` - Build for production (Chrome by default)
- `npm run build:chrome` - Build specifically for Chrome
- `npm run build:firefox` - Build specifically for Firefox
- `npm run dev` - Build for development
- `npm run watch` - Watch for changes and rebuild

### Docker Scripts

- `npm run docker:dev` - Start development environment with Docker Compose
- `npm run docker:build` - Build extension using Docker Compose
- `npm run docker:prod` - Start production server with Docker Compose
- `npm run docker:build-image` - Build production Docker image
- `npm run docker:run` - Run production Docker container