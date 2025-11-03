# build.ps1 - Windows equivalent of build.sh
# Usage: From project root in PowerShell (or CI):
#   $env:SUPABASE_URL='https://...'; $env:SUPABASE_ANON_KEY='...'; ./build.ps1

if (-not $env:SUPABASE_URL -or -not $env:SUPABASE_ANON_KEY) {
    Write-Error "SUPABASE_URL and SUPABASE_ANON_KEY must be set as environment variables"
    exit 1
}

$envJsPath = Join-Path $PSScriptRoot 'env.js'
if (-not (Test-Path $envJsPath)) {
    Write-Error "env.js template not found at $envJsPath"
    exit 1
}

# Read template and replace placeholders
$content = Get-Content -Raw -Path $envJsPath
$content = $content -replace '<!-- SUPABASE_URL_PLACEHOLDER -->', [System.Text.RegularExpressions.Regex]::Escape($env:SUPABASE_URL)
$content = $content -replace '<!-- SUPABASE_ANON_KEY_PLACEHOLDER -->', [System.Text.RegularExpressions.Regex]::Escape($env:SUPABASE_ANON_KEY)

# Write to env.js (overwrites template in-place so the result is the generated file)
Set-Content -Path $envJsPath -Value $content -Encoding UTF8
Write-Host "✅ env.js generated from environment variables"
Write-Host "(Remember env.js is gitignored; do not commit it)"