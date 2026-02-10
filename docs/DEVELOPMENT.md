# Development Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18.x or higher ([Download](https://nodejs.org/))
- **npm**: Version 9.x or higher (comes with Node.js)
- **Git**: For version control ([Download](https://git-scm.com/))
- **Obsidian**: Latest version ([Download](https://obsidian.md))
- **Code Editor**: VS Code recommended with extensions:
  - ESLint
  - Prettier
  - TypeScript and JavaScript Language Features

## ⚠️ Development Philosophy: Test-Driven Development (TDD)

**CRITICAL: This project follows strict Test-Driven Development.**

Before implementing ANY feature:

1. **Write tests first** (RED)
2. **Implement minimal code** to pass tests (GREEN)
3. **Refactor** while keeping tests green (REFACTOR)

📖 **See [TDD-GUIDE.md](TDD-GUIDE.md) for complete TDD workflow and examples.**

**Coverage Requirements:**

- Minimum 70% overall coverage
- 100% coverage for critical paths (auth, API, sync)
- All tests must pass before committing

**Run tests:**

```bash
npm test                    # Run all tests
npm test -- --watch        # Watch mode for development
npm test -- --coverage     # Generate coverage report
```

---

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/mehmedmaljoki/google-calender-timeline.git
cd google-calender-timeline
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages including:

- TypeScript compiler
- ESBuild for fast bundling
- Testing framework
- Linting tools

### 3. Configure Google Cloud Project

To develop with Google Calendar API, you need to set up a Google Cloud Project:

#### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name it "Obsidian Calendar Timeline Dev"
4. Click "Create"

#### Step 2: Enable Google Calendar API

1. In your project, go to "APIs & Services" → "Library"
2. Search for "Google Calendar API"
3. Click on it and press "Enable"

#### Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Configure OAuth consent screen if prompted:
   - User Type: External (for testing)
   - App name: "Obsidian Calendar Timeline Dev"
   - User support email: Your email
   - Developer contact: Your email
4. Application type: "Desktop app"
5. Name: "Obsidian Calendar Dev"
6. Click "Create"
7. Download the credentials JSON

#### Step 4: Configure Credentials in Development

Create a `.env.local` file in the project root:

```bash
# .env.local
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

**Note**: This file is gitignored and should never be committed.

### 4. Set Up Test Vault

Create a dedicated Obsidian vault for development:

```bash
# Create test vault directory
mkdir -p ~/obsidian-test-vault

# Configure plugin path (you'll do this for each development session)
# Windows (PowerShell)
$env:OBSIDIAN_VAULT = "C:\Users\YourName\obsidian-test-vault"

# macOS/Linux
export OBSIDIAN_VAULT="$HOME/obsidian-test-vault"
```

### 5. Link Plugin to Test Vault

```bash
# Windows (PowerShell)
New-Item -ItemType SymbolicLink -Path "$env:OBSIDIAN_VAULT\.obsidian\plugins\google-calendar-timeline" -Target (Get-Location)

# macOS/Linux
ln -s "$(pwd)" "$OBSIDIAN_VAULT/.obsidian/plugins/google-calendar-timeline"
```

## Development Workflow

### Running in Development Mode

```bash
# Start development build with hot reload
npm run dev
```

This command:

- Watches for file changes
- Automatically rebuilds the plugin
- Copies output to your test vault
- Shows build errors in terminal

### Manual Build

```bash
# Production build
npm run build

# Build with type checking
npm run build:check
```

### Testing Your Changes

1. **Start dev mode**: `npm run dev`
2. **Open Obsidian** with your test vault
3. **Enable the plugin**: Settings → Community Plugins → Google Calendar Timeline
4. **Reload Obsidian** when you make changes: `Ctrl+R` (Windows/Linux) or `Cmd+R` (macOS)
5. **Open Developer Tools**: `Ctrl+Shift+I` or `Cmd+Option+I`

### Development Tips

#### Hot Reload

After saving changes, the plugin rebuilds automatically. In Obsidian:

- Press `Ctrl+R` / `Cmd+R` to reload
- Or use Command Palette → "Reload app without saving"

#### Console Logging

Add debug logs to your code:

```typescript
console.log('[GCal Debug]', 'Message here', data);
```

View logs in Obsidian's Developer Tools (Console tab).

#### Debugging

1. **Set breakpoints** in Obsidian's DevTools
2. **Use source maps** to debug TypeScript directly
3. **Check the Sources tab** in DevTools to see your original TS files

## Code Quality

### Linting

```bash
# Check for linting errors
npm run lint

# Auto-fix linting issues
npm run lint:fix
```

### Code Formatting

```bash
# Check formatting
npm run format:check

# Format all files
npm run format
```

### Type Checking

```bash
# Run TypeScript compiler in check mode
npm run type-check
```

### Pre-commit Hook (Recommended)

Install Husky for automatic checks before commits:

```bash
# Install Husky
npm install --save-dev husky
npx husky install

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run lint && npm run type-check"
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- CalendarAPI.test.ts

# Generate coverage report
npm run test:coverage
```

### Writing Tests

Create test files alongside source files with `.test.ts` extension:

```typescript
// src/services/SyncService.test.ts
import { SyncService } from './SyncService';

describe('SyncService', () => {
	let syncService: SyncService;

	beforeEach(() => {
		syncService = new SyncService();
	});

	it('should sync calendars successfully', async () => {
		const result = await syncService.syncNow();
		expect(result.success).toBe(true);
	});
});
```

### Test Coverage

Aim for:

- **80%+ overall coverage**
- **100% coverage for critical paths** (auth, sync, data transformation)
- **Integration tests** for API interactions
- **Unit tests** for business logic

## Project Structure

```
google-calender-timeline/
├── .github/              # GitHub configuration
│   ├── workflows/        # CI/CD pipelines
│   └── ISSUE_TEMPLATE/   # Issue templates
├── docs/                 # Documentation
│   ├── plugin-context.md
│   └── ARCHITECTURE.md
├── src/                  # Source code
│   ├── main.ts          # Plugin entry
│   ├── auth/            # Authentication
│   ├── api/             # API layer
│   ├── ui/              # UI components
│   ├── services/        # Business logic
│   └── types/           # Type definitions
├── styles/              # CSS styles
│   └── timeline.css
├── tests/               # Test files
│   ├── unit/
│   └── integration/
├── .eslintrc.json       # ESLint configuration
├── .prettierrc          # Prettier configuration
├── tsconfig.json        # TypeScript configuration
├── esbuild.config.mjs   # Build configuration
├── manifest.json        # Plugin manifest
├── package.json         # Node.js dependencies
└── README.md           # Project documentation
```

## Common Commands

```bash
# Development
npm run dev              # Start dev mode with watch
npm run build            # Production build
npm run clean            # Clean build artifacts

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix linting issues
npm run format           # Format code with Prettier
npm run format:check     # Check formatting
npm run type-check       # Type check without building

# Testing
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report
npm run test:e2e         # Run end-to-end tests

# Analysis
npm run analyze          # Analyze bundle size
npm audit                # Check for vulnerabilities
npm outdated             # Check for outdated packages
```

## Troubleshooting

### Build Errors

**Problem**: `Cannot find module 'obsidian'`

**Solution**:

```bash
npm install
```

**Problem**: TypeScript errors after pulling new changes

**Solution**:

```bash
npm run clean
npm install
npm run build
```

### Plugin Not Loading

**Problem**: Plugin doesn't appear in Obsidian

**Solution**:

1. Check that files are in correct location: `{vault}/.obsidian/plugins/google-calendar-timeline/`
2. Ensure `manifest.json`, `main.js`, and `styles.css` exist
3. Reload Obsidian
4. Check console for errors

**Problem**: Changes not reflected after rebuild

**Solution**:

1. Ensure `npm run dev` is running
2. Reload Obsidian after changes
3. Clear Obsidian's cache: Settings → About → "Show debug info" → "Clear cache"

### OAuth Issues

**Problem**: OAuth flow fails

**Solution**:

1. Verify Google Cloud Project is set up correctly
2. Check OAuth credentials in `.env.local`
3. Ensure redirect URI matches exactly
4. Check if API is enabled in Google Cloud Console

### Performance Issues

**Problem**: Slow build times

**Solution**:

```bash
# Use faster build with less type checking
npm run build -- --no-type-check

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Environment Variables

Create `.env.local` for local development:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

# Development
NODE_ENV=development
DEBUG=true

# Testing
TEST_GOOGLE_ACCOUNT=test@example.com
```

## IDE Setup

### VS Code

Recommended `.vscode/settings.json`:

```json
{
	"editor.formatOnSave": true,
	"editor.codeActionsOnSave": {
		"source.fixAll.eslint": true
	},
	"typescript.tsdk": "node_modules/typescript/lib",
	"eslint.validate": ["javascript", "typescript"],
	"files.exclude": {
		"**/.git": true,
		"**/node_modules": true,
		"**/dist": true
	}
}
```

Recommended extensions:

- ESLint (`dbaeumer.vscode-eslint`)
- Prettier (`esbenp.prettier-vscode`)
- Error Lens (`usernamehw.errorlens`)
- GitLens (`eamodio.gitlens`)

## Contributing

Before submitting a PR:

1. ✅ Run all tests: `npm test`
2. ✅ Check linting: `npm run lint`
3. ✅ Check formatting: `npm run format:check`
4. ✅ Verify types: `npm run type-check`
5. ✅ Build successfully: `npm run build`
6. ✅ Test in Obsidian manually
7. ✅ Update documentation if needed
8. ✅ Follow commit conventions

See [CONTRIBUTING.md](../CONTRIBUTING.md) for detailed guidelines.

## Resources

- [Obsidian Plugin API](https://github.com/obsidianmd/obsidian-api)
- [Obsidian Sample Plugin](https://github.com/obsidianmd/obsidian-sample-plugin)
- [Google Calendar API](https://developers.google.com/calendar/api/guides/overview)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [vis-timeline Docs](https://visjs.github.io/vis-timeline/docs/timeline/)

## Getting Help

- 📖 Check [Documentation](https://github.com/mehmedmaljoki/google-calender-timeline/wiki)
- 💬 Ask in [Discussions](https://github.com/mehmedmaljoki/google-calender-timeline/discussions)
- 🐛 Report in [Issues](https://github.com/mehmedmaljoki/google-calender-timeline/issues)
- 💡 Read [Architecture Docs](./ARCHITECTURE.md)

---

Happy coding! 🚀
