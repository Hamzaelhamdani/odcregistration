# build.ps1 - Script de build

if (-not $env:SUPABASE_URL -or -not $env:SUPABASE_ANON_KEY) {
    Write-Error "Variables manquantes"
    exit 1
}

$content = @"
(function() {
    "use strict";
    window.ENV = {
        SUPABASE_URL: '$($env:SUPABASE_URL)',
        SUPABASE_ANON_KEY: '$($env:SUPABASE_ANON_KEY)'
    };
})();
"@

Set-Content -Path "env.js" -Value $content -Encoding UTF8
Write-Host "env.js généré"
