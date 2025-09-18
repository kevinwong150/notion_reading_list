#!/bin/bash

# Build and run the browser extension in Docker

set -e

echo "🚀 Building Notion Reading List Browser Extension with Docker"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Function to build locally and then create production image
build_production() {
    echo "📦 Building extension locally..."
    npm run build
    
    echo "🐳 Building Docker production image..."
    docker build -t notion-reading-list .
    
    echo "✅ Production image built successfully!"
    echo "Run with: docker run -p 8080:80 notion-reading-list"
    echo "Then visit: http://localhost:8080/popup.html"
}

# Function to run development environment
run_development() {
    echo "🔧 Starting development environment..."
    docker compose up dev
}

# Function to clean up Docker resources
cleanup() {
    echo "🧹 Cleaning up Docker resources..."
    docker compose down 2>/dev/null || true
    docker stop notion-reading-list 2>/dev/null || true
    docker rm notion-reading-list 2>/dev/null || true
    echo "✅ Cleanup completed!"
}

# Parse command line arguments
case "$1" in
    "prod"|"production")
        build_production
        ;;
    "dev"|"development")
        run_development
        ;;
    "clean"|"cleanup")
        cleanup
        ;;
    *)
        echo "Usage: $0 {prod|dev|clean}"
        echo ""
        echo "Commands:"
        echo "  prod  - Build extension locally and create production Docker image"
        echo "  dev   - Start development environment with hot reloading"
        echo "  clean - Clean up Docker containers and resources"
        echo ""
        echo "Examples:"
        echo "  $0 dev   # Start development environment"
        echo "  $0 prod  # Build for production"
        echo "  $0 clean # Clean up resources"
        exit 1
        ;;
esac