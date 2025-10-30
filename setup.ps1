# OnlyFans Scraper Setup Script for Windows (PowerShell)
# Run this script to set up your local development environment

Write-Host "🚀 OnlyFans Scraper - Local Setup" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Node.js not found. Please install Node.js 18+ from https://nodejs.org/" -ForegroundColor Red
    exit 1
} else {
    Write-Host "✅ Node.js installed: $nodeVersion" -ForegroundColor Green
}

# Check if Python is installed
Write-Host "Checking Python installation..." -ForegroundColor Yellow
$pythonVersion = python --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Python not found. Please install Python 3.8+ from https://www.python.org/" -ForegroundColor Red
    exit 1
} else {
    Write-Host "✅ Python installed: $pythonVersion" -ForegroundColor Green
}

# Install Node.js dependencies
Write-Host ""
Write-Host "Installing Node.js dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install Node.js dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Node.js dependencies installed" -ForegroundColor Green

# Install Python dependencies
Write-Host ""
Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install Python dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Python dependencies installed" -ForegroundColor Green

# Check for .env file
Write-Host ""
if (Test-Path ".env") {
    Write-Host "✅ .env file found" -ForegroundColor Green
} else {
    Write-Host "⚠️  .env file not found. Creating template..." -ForegroundColor Yellow
    
    $envTemplate = @"
# Supabase Configuration
SUPABASE_URL=https://sirudrqheimbgpkchtwi.supabase.co
SUPABASE_KEY=your-service-role-key-here

# Database
TABLE_NAME=onlyfans_profiles

# CSV Data
CSV_PATH=onlyfans_profiles.csv
"@
    
    $envTemplate | Out-File -FilePath ".env" -Encoding utf8
    Write-Host "✅ Created .env template. Please edit it with your actual credentials." -ForegroundColor Green
}

# Summary
Write-Host ""
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit .env file with your Supabase credentials" -ForegroundColor White
Write-Host "2. Run 'npm start' to start the local server" -ForegroundColor White
Write-Host "3. Visit http://localhost:3000 in your browser" -ForegroundColor White
Write-Host ""
Write-Host "For scraping data:" -ForegroundColor Cyan
Write-Host "python scripts/mega_onlyfans_scraper_full.py --help" -ForegroundColor White
Write-Host ""
Write-Host "For more info, see README.md" -ForegroundColor Cyan
Write-Host ""
