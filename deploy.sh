#!/bin/bash

# 🚀 GaavConnect Vercel Deployment Script

echo "🚀 Starting GaavConnect deployment to Vercel..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Build the project locally to check for errors
echo "🔨 Building project locally..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix the errors before deploying."
    exit 1
fi

echo "✅ Local build successful!"

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

if [ $? -eq 0 ]; then
    echo "🎉 Deployment successful!"
    echo "📱 Your GaavConnect AI Route Optimizer is now live!"
    echo "🔗 Check your deployment URL above"
else
    echo "❌ Deployment failed. Please check the error messages above."
    exit 1
fi

echo "✨ Deployment complete! Your AI-powered route optimization platform is ready!"
