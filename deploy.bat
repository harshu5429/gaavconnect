@echo off
echo 🚀 Starting GaavConnect deployment to Vercel...

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: package.json not found. Please run this script from the project root.
    pause
    exit /b 1
)

REM Check if Vercel CLI is installed
where vercel >nul 2>nul
if %errorlevel% neq 0 (
    echo 📦 Installing Vercel CLI...
    npm install -g vercel
)

REM Build the project locally to check for errors
echo 🔨 Building project locally...
npm run build

if %errorlevel% neq 0 (
    echo ❌ Build failed. Please fix the errors before deploying.
    pause
    exit /b 1
)

echo ✅ Local build successful!

REM Deploy to Vercel
echo 🌐 Deploying to Vercel...
vercel --prod

if %errorlevel% equ 0 (
    echo 🎉 Deployment successful!
    echo 📱 Your GaavConnect AI Route Optimizer is now live!
    echo 🔗 Check your deployment URL above
) else (
    echo ❌ Deployment failed. Please check the error messages above.
    pause
    exit /b 1
)

echo ✨ Deployment complete! Your AI-powered route optimization platform is ready!
pause
