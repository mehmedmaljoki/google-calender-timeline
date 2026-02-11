# Local Testing Guide

This guide shows you how to test the Google Calendar Timeline plugin locally in Obsidian, just like professional plugin developers do.

## 🎯 The Best Practice Setup

Professional Obsidian plugin developers use a **separate test vault** with an automated build pipeline that hot-reloads changes. This is the exact same approach used by popular plugins like Dataview, Templater, and Kanban.

## 🚀 Quick Start (First Time Setup)

### One-Command Setup

Run this single command to set up everything:

```bash
npm run setup:dev
```

This automatically:

- ✅ Creates a test vault at `~/obsidian-test-vault`
- ✅ Creates a symlink to your plugin
- ✅ Configures Obsidian to load your plugin
- ✅ Builds the plugin
- ✅ Creates a welcome note with instructions

### Open Your Test Vault

```bash
# macOS
open -a Obsidian ~/obsidian-test-vault

# Or manually: File → Open Vault → Browse to ~/obsidian-test-vault
```

### Enable the Plugin

1. In Obsidian, go to **Settings** → **Community Plugins**
2. **Disable Safe Mode** (if enabled)
3. You should see **"Google Calendar Timeline"** in the list
4. **Enable** it

## 🔥 Development Workflow (The Pro Way)

### 1. Start Development Mode

In your terminal:

```bash
npm run dev
```

You'll see:

```
👀 Watching for changes...
📁 Test vault: /Users/mehmed/obsidian-test-vault
💡 Press Cmd+R in Obsidian to reload after changes
```

**This watches your TypeScript files and auto-rebuilds + auto-copies to your test vault on every save!**

### 2. Make Changes & Test

1. **Edit any file** in `src/` (e.g., `src/ui/TimelineView.ts`)
2. **Save** the file (`Cmd+S`)
3. In terminal, you'll see: `✅ Plugin files copied to test vault`
4. **In Obsidian, press `Cmd+R`** to reload the plugin
5. **Test your changes** immediately!

### 3. Debug with DevTools

**Open Developer Console in Obsidian:**

- macOS: `Cmd+Option+I`
- Windows/Linux: `Ctrl+Shift+I`

**Useful tabs:**

- **Console**: See `console.log()` output and errors
- **Sources**: Set breakpoints in your TypeScript (source maps enabled!)
- **Network**: Monitor API calls to Google Calendar

**Add debug logs in your code:**

```typescript
console.log('[GCal Debug] Timeline loaded', this.events);
console.error('[GCal Error] Sync failed', error);
console.warn('[GCal Warn] Missing token');
```

### 4. Test Plugin Commands

Open Command Palette (`Cmd+P`) and try:

- `Google Calendar: Open timeline`
- `Google Calendar: Sync now`
- `Google Calendar: Connect account`

## 🧪 Testing Best Practices

### Before Testing a Fix

Always run tests first:

```bash
# Run all tests
npm test

# Run tests in watch mode (recommended for TDD)
npm test -- --watch

# Run specific test file
npm test SyncService.test.ts
```

### The TDD Workflow

**⚠️ CRITICAL: Write tests BEFORE fixing bugs!**

```bash
# Terminal 1: Watch mode for tests
npm test -- --watch

# Terminal 2: Dev mode for live reload
npm run dev
```

**Workflow:**

1. Write a failing test that reproduces the bug
2. Watch test fail (RED 🔴)
3. Fix the bug in source code
4. Watch test pass (GREEN 🟢)
5. Reload in Obsidian (`Cmd+R`)
6. Verify fix works in UI
7. Refactor if needed (tests stay green)

### Testing Scenarios

#### Test Authentication Flow

1. Go to plugin settings
2. Click "Connect Google Account"
3. Watch console for OAuth flow logs
4. Check if token is stored correctly

#### Test Timeline View

1. Open timeline via Command Palette
2. Check if events load
3. Try different date ranges
4. Check console for API calls

#### Test Sync Service

1. Enable auto-sync in settings
2. Watch console for sync logs
3. Modify event in Google Calendar
4. Verify it syncs to Obsidian

#### Test Error Handling

1. Disconnect from internet
2. Try to sync
3. Check if error is handled gracefully
4. Verify user sees friendly error message

## 🔍 Common Debugging Scenarios

### Plugin Not Loading?

```bash
# Check if symlink exists
ls -la ~/obsidian-test-vault/.obsidian/plugins/

# Rebuild
npm run build

# Check for errors
npm run build:check
```

### Changes Not Appearing?

1. **Did you save the file?** (`Cmd+S`)
2. **Did you reload Obsidian?** (`Cmd+R`)
3. **Check terminal** - did esbuild rebuild?
4. **Hard reset**: Close Obsidian, rebuild, reopen

### Console Says "undefined"?

- Check your imports
- Verify types in TypeScript
- Look for null/undefined checks

### API Calls Failing?

1. Check Network tab in DevTools
2. Verify OAuth token is valid
3. Check Google Calendar API quota
4. Look for CORS errors

## 📊 Monitoring Performance

### Check Bundle Size

```bash
npm run build
ls -lh main.js
```

Keep it under 2MB for fast loading.

### Profile with DevTools

1. Open DevTools → Performance tab
2. Click Record
3. Perform actions in Obsidian
4. Stop recording
5. Analyze slow operations

## 🎨 Testing UI Changes

### Live CSS Editing

You can even edit CSS live in Obsidian!

1. Open DevTools → Elements tab
2. Find element you want to style
3. Edit styles in real-time
4. Copy working styles to `styles.css`
5. Save and reload

### Test in Different Themes

- Switch between light/dark mode
- Test with popular community themes
- Ensure colors are readable

## 🚦 Pre-Commit Checklist

Before committing your changes:

```bash
# Run full validation
npm run validate

# Or step by step:
npm run build        # ✅ Build succeeds
npm test            # ✅ All tests pass
npm run lint        # ✅ No linting errors
npm run test:coverage # ✅ Coverage > 70%
```

## 🎓 Pro Tips

### Multiple Test Vaults

Want to test with different configurations?

```bash
# Create another vault
mkdir ~/obsidian-test-vault-2

# Set vault path before running dev
OBSIDIAN_VAULT=~/obsidian-test-vault-2 npm run dev
```

### Keep Test Vault Minimal

- Don't put important notes in test vault
- Keep it clean for testing
- Create test notes to verify functionality

### Use Git Worktrees for Bug Fixes

```bash
# Create worktree for bug fix
git worktree add ../gcal-bugfix-123 -b bugfix/issue-123

# Each worktree can have its own test vault
cd ../gcal-bugfix-123
OBSIDIAN_VAULT=~/test-vault-bugfix npm run dev
```

### Automate Common Tasks

Add aliases to your `~/.zshrc`:

```bash
alias gcal-dev="cd ~/dev/google-calender-timeline && npm run dev"
alias gcal-test="cd ~/dev/google-calender-timeline && npm test -- --watch"
alias gcal-vault="open -a Obsidian ~/obsidian-test-vault"
```

## 🆘 Troubleshooting

### "Cannot find module" errors

```bash
npm install
```

### TypeScript errors in IDE

```bash
npm run build:check
```

### Plugin crashes Obsidian

1. Check console for error stack trace
2. Add try-catch blocks
3. Test with minimal code
4. Bisect recent changes

### OAuth keeps failing

1. Check Google Cloud Console
2. Verify redirect URIs
3. Check token expiration
4. Clear stored tokens in plugin data

## 📚 Learn from Other Plugins

Study how popular plugins handle testing:

- [Dataview](https://github.com/blacksmithgu/obsidian-dataview)
- [Templater](https://github.com/SilentVoid13/Templater)
- [Calendar](https://github.com/liamcain/obsidian-calendar-plugin)

They all use similar development workflows!

---

## 🎉 You're All Set!

You now have a professional Obsidian plugin development environment. This is the same setup used by top plugin developers in the community.

**Essential Commands:**

```bash
npm run setup:dev   # First time setup
npm run dev        # Start development
npm test -- --watch # Run tests in watch mode
```

**In Obsidian:**

- `Cmd+R` - Reload plugin
- `Cmd+Option+I` - Open DevTools
- `Cmd+P` - Command Palette

Happy coding! 🚀
