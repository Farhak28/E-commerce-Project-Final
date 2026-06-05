# Scans tracked git files for common secret patterns before push.
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

$patterns = @(
    'sk_test_[0-9a-zA-Z]{20,}',
    'sk_live_[0-9a-zA-Z]{20,}',
    'pk_test_[0-9a-zA-Z]{20,}',
    'pk_live_[0-9a-zA-Z]{20,}',
    'whsec_[0-9a-zA-Z]{20,}',
    'AIza[0-9A-Za-z_-]{20,}',
    'AQ\.[0-9A-Za-z_-]{20,}',
    'GEMINI_API_KEY\s*=\s*[A-Za-z0-9_.-]{10,}'
)

$tracked = git ls-files
$hits = @()

foreach ($file in $tracked) {
    if (-not (Test-Path $file)) { continue }
    $content = Get-Content $file -Raw -ErrorAction SilentlyContinue
    if (-not $content) { continue }
    foreach ($pattern in $patterns) {
        if ($content -match $pattern) {
            $hits += [PSCustomObject]@{ File = $file; Pattern = $pattern }
        }
    }
}

if ($hits.Count -eq 0) {
    Write-Host "OK: No common secret patterns found in tracked files." -ForegroundColor Green
    exit 0
}

Write-Host "FAIL: Possible secrets in tracked files:" -ForegroundColor Red
$hits | Format-Table -AutoSize
Write-Host "Remove or replace with placeholders, then run scripts/scrub-git-history.ps1 if needed."
exit 1
