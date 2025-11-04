#!/bin/bash
# build.sh - Build script for Netlify
# This script injects environment variables into env.js at build time

set -e  # Exit on error

echo "🔧 Starting build process..."

# Check if environment variables are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "❌ Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set in Netlify environment variables"
    exit 1
fi

# Check if env.js.template exists
if [ ! -f "env.js.template" ]; then
    echo "❌ Error: env.js.template not found"
    exit 1
fi

echo "📝 Copying template and generating env.js with environment variables..."

# Copy template to env.js
cp env.js.template env.js

# Replace placeholders in env.js
sed -i "s|__SUPABASE_URL__|$SUPABASE_URL|g" env.js
sed -i "s|__SUPABASE_ANON_KEY__|$SUPABASE_ANON_KEY|g" env.js

echo "✅ env.js generated successfully"
echo "✅ Build completed"
