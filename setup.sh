#!/bin/bash
# OnlyFans Scraper Setup Script for Linux/Mac
# Run this script to set up your local development environment

echo "🚀 OnlyFans Scraper - Local Setup"
echo "================================="
echo ""

# Check if Node.js is installed
echo "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
else
    echo "✅ Node.js installed: $(node --version)"
fi

# Check if Python is installed
echo "Checking Python installation..."
if ! command -v python3 &> /dev/null; then
    echo "❌ Python not found. Please install Python 3.8+ from https://www.python.org/"
    exit 1
else
    echo "✅ Python installed: $(python3 --version)"
fi

# Install Node.js dependencies
echo ""
echo "Installing Node.js dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install Node.js dependencies"
    exit 1
fi
echo "✅ Node.js dependencies installed"

# Install Python dependencies
echo ""
echo "Installing Python dependencies..."
pip3 install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "❌ Failed to install Python dependencies"
    exit 1
fi
echo "✅ Python dependencies installed"

# Check for .env file
echo ""
if [ -f ".env" ]; then
    echo "✅ .env file found"
else
    echo "⚠️  .env file not found. Creating template..."
    
    cat > .env << 'EOF'
# Supabase Configuration
SUPABASE_URL=https://sirudrqheimbgpkchtwi.supabase.co
SUPABASE_KEY=your-service-role-key-here

# Database
TABLE_NAME=onlyfans_profiles

# CSV Data
CSV_PATH=onlyfans_profiles.csv
EOF
    
    echo "✅ Created .env template. Please edit it with your actual credentials."
fi

# Summary
echo ""
echo "================================="
echo "✅ Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your Supabase credentials"
echo "2. Run 'npm start' to start the local server"
echo "3. Visit http://localhost:3000 in your browser"
echo ""
echo "For scraping data:"
echo "python3 scripts/mega_onlyfans_scraper_full.py --help"
echo ""
echo "For more info, see README.md"
echo ""
