#!/bin/bash

# Hostel HUB - Start Script

echo "🚀 Starting Hostel HUB..."

# Check if node_modules exists, if not install dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 node_modules not found. Installing dependencies..."
    npm install
fi

# Start the development server
echo "✨ Starting Vite development server..."
npm run dev
