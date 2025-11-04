# build.ps1 - Windows equivalent of build.sh
# Usage: From project root in PowerShell (or CI):
#   $env:SUPABASE_URL='https://...'; $env:SUPABASE_ANON_KEY='...'; ./build.ps1

if (-not $env:SUPABASE_URL -or -not $env:SUPABASE_ANON_KEY) {
    Write-Error "SUPABASE_URL and SUPABASE_ANON_KEY must be set as environment variables"
    exit 1
}

$templatePath = Join-Path $PSScriptRoot 'env.js.template'
if (-not (Test-Path $templatePath)) {
    Write-Error "env.js.template not found at $templatePath"
    exit 1
}

$envJsPath = Join-Path $PSScriptRoot 'env.js'

# Copy template to env.js
Write-Host "📝 Copying template and generating env.js..."
Copy-Item -Path $templatePath -Destination $envJsPath -Force

# Read template and replace placeholders
$content = Get-Content -Raw -Path $envJsPath
$content = $content -replace '__SUPABASE_URL__', [System.Text.RegularExpressions.Regex]::Escape($env:SUPABASE_URL)
$content = $content -replace '__SUPABASE_ANON_KEY__', [System.Text.RegularExpressions.Regex]::Escape($env:SUPABASE_ANON_KEY)

# Write to env.js (overwrites template in-place so the result is the generated file)
Set-Content -Path $envJsPath -Value $content -Encoding UTF8
Write-Host "✅ env.js generated from environment variables"
Write-Host "(Remember env.js is gitignored; do not commit it)"