# Rewrites git history by creating a single clean commit (orphan branch).
# Use when old commits contained leaked API keys.
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

if (git status --porcelain | Select-String -Pattern "^\?\?" -NotMatch) {
    Write-Host "You have uncommitted changes. They will be included in the new clean commit." -ForegroundColor Yellow
}

$branch = git branch --show-current
Write-Host "Creating clean history on branch '$branch'..." -ForegroundColor Yellow

git checkout --orphan github-clean-temp
git add -A
git commit -m "Corner Store e-commerce platform with AI shopping assistant"

git branch -D $branch 2>$null
git branch -m $branch

# Remove filter-branch backups and old unreachable commits
if (Test-Path ".git/refs/original") {
    Remove-Item -Recurse -Force ".git/refs/original"
}
git reflog expire --expire=now --all 2>$null
git gc --prune=now --aggressive 2>$null

Write-Host "Done. Verify with: .\scripts\check-secrets.ps1" -ForegroundColor Green
Write-Host "Then push: git push --force-with-lease origin $branch" -ForegroundColor Green
Write-Host "IMPORTANT: Rotate Stripe and Gemini keys if they were ever committed or shared." -ForegroundColor Yellow
