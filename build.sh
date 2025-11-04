#!/bin/bash
set -e
echo "Starting build..."
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "Error: Environment variables missing"
    exit 1
fi
echo "Generating env.js..."
cat > env.js << 'ENDOFFILE'
(function() {
    "use strict";
    window.ENV = {
        SUPABASE_URL: 'TEMP_URL',
        SUPABASE_ANON_KEY: 'TEMP_KEY'
    };
})();
ENDOFFILE
sed -i "s|TEMP_URL|$SUPABASE_URL|g" env.js
sed -i "s|TEMP_KEY|$SUPABASE_ANON_KEY|g" env.js
echo "Build completed"