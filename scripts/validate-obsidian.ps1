Write-Host "[Validating Obsidian Plugin Requirements...]" -ForegroundColor Cyan

$errors = 0

# Check for fetch
Write-Host "`nChecking for fetch usage..." -ForegroundColor Yellow
$fetchResults = Select-String -Path "src\**\*.ts" -Pattern 'fetch\(' -Exclude "*test.ts","*mock*" | Where-Object { $_.Line -notmatch "requestUrl" }
if ($fetchResults) {
    Write-Host "[X] ERROR: Found fetch usage. Use requestUrl instead!" -ForegroundColor Red
    $fetchResults | ForEach-Object { Write-Host "   $($_.Path):$($_.LineNumber)" -ForegroundColor Gray }
    $errors++
} else {
    Write-Host "[OK] No fetch usage found" -ForegroundColor Green
}

# Check for console.log/info/debug
Write-Host "`nChecking for forbidden console statements..." -ForegroundColor Yellow
$consoleResults = Select-String -Path "src\**\*.ts" -Pattern "console\.(log|info|debug)" -Exclude "*test.ts","*mock*"
if ($consoleResults) {
    Write-Host "[X] ERROR: Found forbidden console statements!" -ForegroundColor Red
    Write-Host "   Only console.error, console.warn are allowed." -ForegroundColor Gray
    $consoleResults | ForEach-Object { Write-Host "   $($_.Path):$($_.LineNumber)" -ForegroundColor Gray }
    $errors++
} else {
    Write-Host "[OK] No forbidden console statements found" -ForegroundColor Green
}

# Check for HTML heading creation in Settings
Write-Host "`nChecking for HTML heading creation in Settings..." -ForegroundColor Yellow
$headingPattern = "createEl\(" + "'h[1-6]'"
$headingResults = Select-String -Path "src\ui\SettingsTab.ts" -Pattern $headingPattern
if ($headingResults) {
    Write-Host "[X] ERROR: Found HTML heading creation in Settings. Use Setting().setHeading instead!" -ForegroundColor Red
    $headingResults | ForEach-Object { Write-Host "   $($_.Path):$($_.LineNumber)" -ForegroundColor Gray }
    $errors++
} else {
    Write-Host "[OK] No HTML heading creation found in Settings" -ForegroundColor Green
}

# Check for vault.delete
Write-Host "`nChecking for vault.delete usage..." -ForegroundColor Yellow
$deleteResults = Select-String -Path "src\**\*.ts" -Pattern "vault\.delete" -Exclude "*test.ts","*mock*"
if ($deleteResults) {
    Write-Host "[X] ERROR: Found vault.delete. Use fileManager.trashFile instead!" -ForegroundColor Red
    $deleteResults | ForEach-Object { Write-Host "   $($_.Path):$($_.LineNumber)" -ForegroundColor Gray }
    $errors++
} else {
    Write-Host "[OK] No vault.delete usage found" -ForegroundColor Green
}

# Check for detachLeavesOfType in onunload
Write-Host "`nChecking for detachLeavesOfType in onunload..." -ForegroundColor Yellow
$mainContent = Get-Content "src\main.ts" -Raw
if ($mainContent -match "onunload[\s\S]{0,200}detachLeavesOfType") {
    Write-Host "[X] ERROR: Found detachLeavesOfType in onunload!" -ForegroundColor Red
    $errors++
} else {
    Write-Host "[OK] No detachLeavesOfType in onunload" -ForegroundColor Green
}

# Check for Title Case in UI text (warning only)
Write-Host "`nChecking for Title Case in UI text..." -ForegroundColor Yellow
$titleCaseResults = Select-String -Path "src\**\*.ts" -Pattern "(setName|name:)\s*['\`"].*\s[A-Z]" -Exclude "*test.ts","*mock*","*types*"
if ($titleCaseResults) {
    Write-Host "[!] WARNING: Possible Title Case detected. UI text should use sentence case." -ForegroundColor Yellow
    Write-Host "   Example: 'Open timeline' not 'Open Timeline'" -ForegroundColor Gray
    $titleCaseResults | Select-Object -First 5 | ForEach-Object { Write-Host "   $($_.Path):$($_.LineNumber)" -ForegroundColor Gray }
}

Write-Host "`n==========================================" -ForegroundColor Cyan
if ($errors -eq 0) {
    Write-Host "[OK] All Obsidian validation checks passed!" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Cyan
    exit 0
} else {
    Write-Host "[X] Found $errors validation error(s)." -ForegroundColor Red
    Write-Host "   Please fix these issues before submitting to marketplace." -ForegroundColor Yellow
    Write-Host "==========================================" -ForegroundColor Cyan
    exit 1
}
