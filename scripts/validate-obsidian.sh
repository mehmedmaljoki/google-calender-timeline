#!/bin/bash

echo "🔍 Validating Obsidian Plugin Requirements..."

ERRORS=0

# Check for fetch()
echo "Checking for fetch() usage..."
if grep -rn "fetch(" src/ --include="*.ts" | grep -v "requestUrl" | grep -v "test.ts" | grep -v "mock" | grep -v "__mocks__"; then
	echo "❌ ERROR: Found fetch() usage. Use requestUrl instead!"
	ERRORS=$((ERRORS + 1))
else
	echo "✅ No fetch() usage found"
fi

# Check for console.log/info/debug
echo ""
echo "Checking for forbidden console statements..."
if grep -rn "console\.\(log\|info\|debug\)" src/ --include="*.ts" | grep -v "test.ts" | grep -v "mock"; then
	echo "❌ ERROR: Found forbidden console statements (console.log/info/debug)!"
	echo "   Only console.error, console.warn are allowed."
	ERRORS=$((ERRORS + 1))
else
	echo "✅ No forbidden console statements found"
fi

# Check for HTML heading creation in Settings
echo ""
echo "Checking for HTML heading creation in Settings..."
if grep -n "createEl('h[1-6]'" src/ui/SettingsTab.ts 2>/dev/null; then
	echo "❌ ERROR: Found HTML heading creation in Settings. Use Setting().setHeading() instead!"
	ERRORS=$((ERRORS + 1))
else
	echo "✅ No HTML heading creation found in Settings"
fi

# Check for vault.delete
echo ""
echo "Checking for vault.delete() usage..."
if grep -rn "vault\.delete" src/ --include="*.ts" | grep -v "test.ts" | grep -v "mock"; then
	echo "❌ ERROR: Found vault.delete(). Use fileManager.trashFile() instead!"
	ERRORS=$((ERRORS + 1))
else
	echo "✅ No vault.delete() usage found"
fi

# Check for detachLeavesOfType in onunload
echo ""
echo "Checking for detachLeavesOfType in onunload..."
if grep -A 10 "onunload" src/main.ts | grep "detachLeavesOfType"; then
	echo "❌ ERROR: Found detachLeavesOfType in onunload. Don't detach leaves on plugin unload!"
	ERRORS=$((ERRORS + 1))
else
	echo "✅ No detachLeavesOfType in onunload"
fi

# Check for Title Case in UI text
echo ""
echo "Checking for Title Case in UI text..."
if grep -rn "setName\|name:" src/ --include="*.ts" | grep -v "test.ts" | grep -v "mock" | grep -E "['\"]\w+ [A-Z]\w+"; then
	echo "⚠️  WARNING: Possible Title Case detected. UI text should use sentence case."
	echo "   Example: 'Open timeline' not 'Open Timeline'"
fi

echo ""
echo "=========================================="
if [ $ERRORS -eq 0 ]; then
	echo "✅ All Obsidian validation checks passed!"
	echo "=========================================="
	exit 0
else
	echo "❌ Found $ERRORS validation error(s)."
	echo "   Please fix these issues before submitting to marketplace."
	echo "=========================================="
	exit 1
fi
