# Setup script for auto-push git hook
# This script sets up automatic git push after each commit

Write-Host "Setting up auto-push git hook..." -ForegroundColor Green

# Ensure hooks directory exists
$hooksDir = ".git\hooks"
if (-not (Test-Path $hooksDir)) {
    Write-Host "Creating hooks directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $hooksDir -Force | Out-Null
}

# Create post-commit hook
$hookContent = @"
#!/bin/sh
# Auto-push to remote after commit
# This hook runs automatically after each commit

echo ""
echo "========================================="
echo "Auto-pushing changes to remote..."
echo "========================================="

# Push to remote
if git push origin main; then
    echo "✓ Successfully pushed to remote!"
else
    echo "✗ Failed to push. You may need to push manually."
    exit 1
fi

echo "========================================="
echo ""
"@

$hookPath = Join-Path $hooksDir "post-commit"
Set-Content -Path $hookPath -Value $hookContent -Encoding UTF8

# Make it executable (for Git Bash)
Write-Host "Git hook installed successfully!" -ForegroundColor Green
Write-Host "Now every commit will automatically push to remote." -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: If push fails, you may need to:" -ForegroundColor Yellow
Write-Host "  1. Check your git credentials" -ForegroundColor Yellow
Write-Host "  2. Ensure you have push permissions" -ForegroundColor Yellow
Write-Host "  3. Push manually if needed" -ForegroundColor Yellow
