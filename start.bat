@echo off
echo 🚀 Starting Libre PDF Converter Service...
echo ==========================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

echo ✅ Node.js version: 
node --version

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed
) else (
    echo ✅ Dependencies already installed
)

REM Create necessary directories
echo 📁 Creating directories...
if not exist "uploads" mkdir uploads
if not exist "temp" mkdir temp
if not exist "output" mkdir output
if not exist "public" mkdir public
echo ✅ Directories created

REM Start the service
echo 🎯 Starting service on port 3002...
echo 📊 Health check: http://localhost:3002/health
echo 📄 Convert endpoint: http://localhost:3002/convert-docx-to-pdf
echo ==========================================

npm start
