# SafeTrip Vercel Deployment Script
# Run: .\deploy-vercel.ps1

Write-Host "🚀 Starting SafeTrip Deployment to Vercel..." -ForegroundColor Green

# Ensure we are in the correct directory
$ProjectRoot = Get-Location
Write-Host "📂 Current Directory: $ProjectRoot" -ForegroundColor Cyan

# Check if Vercel CLI is installed
if (!(Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "⚠️ Vercel CLI is not installed globally. Installing it temporarily..." -ForegroundColor Yellow
    npm install -g vercel
}

# Navigate to frontend folder containing Next.js
cd frontend

# Deploy using Vercel CLI
Write-Host "📦 Triggering production build and deployment to Vercel..." -ForegroundColor Cyan
vercel --prod --yes

# Navigate back to root
cd ..

Write-Host "🎉 SafeTrip Deployment completed successfully!" -ForegroundColor Green
