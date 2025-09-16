#!/bin/bash

echo "🚀 Starting Libre PDF Converter Service..."
echo "=========================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p uploads temp output public
echo "✅ Directories created"

# Set permissions
chmod -R 755 .

# Start the service
echo "🎯 Starting service on port 3002..."
echo "📊 Health check: http://localhost:3002/health"
echo "📄 Convert endpoint: http://localhost:3002/convert-docx-to-pdf"
echo "=========================================="

npm start
