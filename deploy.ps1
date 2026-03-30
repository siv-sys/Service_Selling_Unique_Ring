# RingOS Platform - Automated Vercel Deployment Script
# Run this script to deploy both backend and frontend automatically

Write-Host "🚀 RingOS Platform - Vercel Deployment" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check if Vercel CLI is installed
Write-Host "📦 Checking Vercel CLI installation..." -ForegroundColor Yellow
try {
    $vercelVersion = vercel --version 2>&1
    Write-Host "✅ Vercel CLI installed: $vercelVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Red
    npm install -g vercel
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Installation failed. Please install manually: npm install -g vercel" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Vercel CLI installed successfully!" -ForegroundColor Green
}

Write-Host ""
Write-Host "🔐 Logging in to Vercel..." -ForegroundColor Yellow
vercel login
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Login failed. Please try again." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Logged in successfully!" -ForegroundColor Green

Write-Host ""
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📦 DEPLOYING BACKEND" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Navigate to backend folder
Set-Location c:\Users\USER\OneDrive\Desktop\Service_Selling_Unique_Ring\backend

# Check if .env.production exists
if (-Not (Test-Path .env.production)) {
    Write-Host "⚠️  .env.production not found! Creating from template..." -ForegroundColor Yellow
    Copy-Item .env.example .env.production
    Write-Host "⚠️  Please edit .env.production with your production values before continuing" -ForegroundColor Yellow
    Write-Host "Press any key to continue after editing .env.production..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# Initialize Vercel project (if not already done)
Write-Host "🔧 Initializing Vercel project..." -ForegroundColor Yellow
vercel init --yes 2>$null

# Link or create project
Write-Host "🔗 Linking to Vercel account..." -ForegroundColor Yellow
$projectName = "ringos-backend-" + (Get-Date -Format "yyyyMMdd-HHmmss")
vercel link --name $projectName --yes 2>$null

# Deploy to preview
Write-Host "🚀 Deploying backend to preview..." -ForegroundColor Yellow
$previewResult = vercel --yes 2>&1
Write-Host $previewResult
Write-Host "✅ Backend preview deployed!" -ForegroundColor Green

# Extract preview URL
$previewUrl = $previewResult | Select-String "https://.*\.vercel\.app" | Select-Object -First 1
if ($previewUrl) {
    Write-Host "📋 Preview URL: $previewUrl" -ForegroundColor Cyan
}

# Deploy to production
Write-Host ""
Write-Host "🌐 Deploying backend to PRODUCTION..." -ForegroundColor Cyan
$prodResult = vercel --prod --yes 2>&1
Write-Host $prodResult

# Extract production URL
$backendUrl = $prodResult | Select-String "https://.*\.vercel\.app" | Select-Object -First 1
if ($backendUrl) {
    Write-Host "✅ BACKEND LIVE: $backendUrl" -ForegroundColor Green
    # Save for later use
    $global:BACKEND_URL = $backendUrl
} else {
    Write-Host "⚠️  Could not extract backend URL. Please check Vercel dashboard." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🎨 DEPLOYING FRONTEND" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Navigate to frontend folder
Set-Location c:\Users\USER\OneDrive\Desktop\Service_Selling_Unique_Ring\frontend

# Check if .env.production exists
if (-Not (Test-Path .env.production)) {
    Write-Host "⚠️  .env.production not found! Creating from template..." -ForegroundColor Yellow
    Copy-Item .env.example .env.production
    
    # Update API URL if we have it
    if ($global:BACKEND_URL) {
        $content = Get-Content .env.production -Raw
        $content = $content -replace 'VITE_API_URL=.*', "VITE_API_URL=$backendUrl/api"
        Set-Content .env.production $content
        Write-Host "✅ Updated VITE_API_URL with backend URL" -ForegroundColor Green
    }
}

# Build locally first
Write-Host "🔨 Building frontend locally..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed! Fix errors before deploying." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build successful!" -ForegroundColor Green

# Initialize Vercel project
Write-Host "🔧 Initializing Vercel project..." -ForegroundColor Yellow
vercel init --yes 2>$null

# Link or create project
Write-Host "🔗 Linking to Vercel account..." -ForegroundColor Yellow
$frontendProjectName = "ringos-frontend-" + (Get-Date -Format "yyyyMMdd-HHmmss")
vercel link --name $frontendProjectName --yes 2>$null

# Deploy to preview
Write-Host "🚀 Deploying frontend to preview..." -ForegroundColor Yellow
$frontendPreviewResult = vercel --yes 2>&1
Write-Host $frontendPreviewResult
Write-Host "✅ Frontend preview deployed!" -ForegroundColor Green

# Deploy to production
Write-Host ""
Write-Host "🌐 Deploying frontend to PRODUCTION..." -ForegroundColor Cyan
$frontendProdResult = vercel --prod --yes 2>&1
Write-Host $frontendProdResult

# Extract frontend URL
$frontendUrl = $frontendProdResult | Select-String "https://.*\.vercel\.app" | Select-Object -First 1
if ($frontendUrl) {
    Write-Host "✅ FRONTEND LIVE: $frontendUrl" -ForegroundColor Green
} else {
    Write-Host "⚠️  Could not extract frontend URL. Please check Vercel dashboard." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🎉 DEPLOYMENT COMPLETE!" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if ($backendUrl -and $frontendUrl) {
    Write-Host "Your RingOS Platform is now LIVE!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Frontend: $frontendUrl" -ForegroundColor Cyan
    Write-Host "🔌 Backend:  $backendUrl" -ForegroundColor Cyan
    Write-Host ""
    
    # Test backend health
    Write-Host "🏥 Testing backend health..." -ForegroundColor Yellow
    try {
        $healthCheck = Invoke-RestMethod -Uri "$backendUrl/api/health" -Method Get -TimeoutSec 10
        Write-Host "✅ Backend health check passed!" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Backend health check failed. Check environment variables in Vercel dashboard." -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Deployment may have issues. Check Vercel dashboard for details." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Add environment variables in Vercel dashboard" -ForegroundColor White
Write-Host "2. Test all features thoroughly" -ForegroundColor White
Write-Host "3. Monitor logs: vercel logs --follow" -ForegroundColor White
Write-Host "4. Check analytics in Vercel dashboard" -ForegroundColor White
Write-Host ""
Write-Host "📖 Full documentation: DEPLOY_NOW.md" -ForegroundColor Yellow
Write-Host ""

# Return to original directory
Set-Location c:\Users\USER\OneDrive\Desktop\Service_Selling_Unique_Ring

Write-Host "Deployment script completed!" -ForegroundColor Green
