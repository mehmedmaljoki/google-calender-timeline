# Contributing to Google Calendar Timeline

First off, thank you for considering contributing to Google Calendar Timeline! It's people like you that make this plugin better for everyone.

## 🌟 Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## 🚀 How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the issue list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

**Bug Report Template:**

```markdown
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:

1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment:**

- OS: [e.g., Windows 11, macOS 13.0, Linux Ubuntu 22.04]
- Obsidian Version: [e.g., 1.4.14]
- Plugin Version: [e.g., 1.2.3]
- Google Account Type: [Personal/Workspace]

**Additional context**
Add any other context about the problem here.
```

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

**Feature Request Template:**

```markdown
**Is your feature request related to a problem?**
A clear and concise description of what the problem is. Ex. I'm always frustrated when [...]

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
A clear and concise description of any alternative solutions or features you've considered.

**Additional context**
Add any other context or screenshots about the feature request here.
```

### Pull Requests

#### Development Setup

1. **Fork and Clone**

   ```bash
   git clone https://github.com/YOUR_USERNAME/google-calender-timeline.git
   cd google-calender-timeline
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Create a Branch**

   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

4. **Follow Test-Driven Development (TDD) - MANDATORY**

   **⚠️ IMPORTANT: Write tests BEFORE implementing any feature!**

   ```bash
   # 1. Write your test first (it should FAIL)
   # Create: src/services/__tests__/YourFeature.test.ts

   # 2. Run tests to verify it fails (RED)
   npm test

   # 3. Implement minimal code to pass the test (GREEN)
   # Edit: src/services/YourFeature.ts

   # 4. Run tests again to verify it passes
   npm test

   # 5. Refactor code while keeping tests green
   # 6. Run tests again to ensure nothing broke
   npm test
   ```

   📖 **Complete TDD workflow:** See [docs/TDD-GUIDE.md](docs/TDD-GUIDE.md)

   **Coverage Requirements:**
   - Minimum 70% overall coverage
   - 100% for critical paths (auth, API, sync)

   ```bash
   # Check coverage before committing
   npm test -- --coverage
   ```

5. **Configure Development Environment**
   - Copy the plugin to your test vault:

     ```bash
     # Windows (PowerShell)
     $env:OBSIDIAN_VAULT="C:\path\to\your\test\vault"
     npm run dev

     # Unix/Linux/macOS
     export OBSIDIAN_VAULT="/path/to/your/test/vault"
     npm run dev
     ```

#### Coding Standards

**TypeScript Style Guide:**

```typescript
// ✅ Good: Use descriptive names, proper types, and JSDoc comments
/**
 * Fetches calendar events from Google Calendar API
 * @param calendarId - The calendar identifier
 * @param timeMin - Start time for event query
 * @param timeMax - End time for event query
 * @returns Promise resolving to array of calendar events
 */
async function fetchCalendarEvents(
	calendarId: string,
	timeMin: Date,
	timeMax: Date
): Promise<CalendarEvent[]> {
	// Implementation
}

// ❌ Bad: Vague names, missing types
async function getEvents(id, start, end) {
	// Implementation
}
```

**Key Principles:**

1. **Type Safety**
   - Always define proper TypeScript types
   - Avoid `any` type unless absolutely necessary
   - Use interfaces for object shapes
   - Use enums for fixed value sets

2. **Code Organization**
   - One class/interface per file (with exceptions for small utilities)
   - Group related functionality in directories
   - Keep functions small and focused (< 50 lines ideally)
   - Use meaningful file and directory names

3. **Error Handling**

   ```typescript
   // ✅ Good: Comprehensive error handling
   try {
   	const events = await this.api.fetchEvents(calendarId);
   	return events;
   } catch (error) {
   	if (error instanceof GoogleAPIError) {
   		this.logger.error('Failed to fetch events', { calendarId, error });
   		this.notifyUser('Unable to sync calendar. Please check your connection.');
   	}
   	throw error;
   }
   ```

4. **Async/Await**
   - Prefer async/await over raw Promises
   - Always handle promise rejections
   - Use Promise.all() for parallel operations

5. **Comments & Documentation**
   - Use JSDoc for public APIs
   - Explain "why" not "what"
   - Update comments when code changes

#### Testing Requirements

All new features and bug fixes must include tests:

```typescript
// Example test structure
describe('CalendarAPI', () => {
	let api: CalendarAPI;

	beforeEach(() => {
		api = new CalendarAPI(mockAuth);
	});

	describe('fetchEvents', () => {
		it('should fetch events for a given date range', async () => {
			const start = new Date('2024-01-01');
			const end = new Date('2024-01-31');

			const events = await api.fetchEvents('primary', start, end);

			expect(events).toBeDefined();
			expect(events.length).toBeGreaterThan(0);
		});

		it('should handle API errors gracefully', async () => {
			mockAuth.setInvalidToken();

			await expect(api.fetchEvents('primary', new Date(), new Date())).rejects.toThrow(
				AuthenticationError
			);
		});
	});
});
```

**Test Coverage Expectations:**

- Unit tests: Aim for 80%+ coverage
- Integration tests: Cover critical user flows
- E2E tests: Cover main plugin features

#### Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvement
- `test`: Adding or updating tests
- `chore`: Changes to build process or auxiliary tools

**Examples:**

```bash
# Feature
git commit -m "feat(timeline): add week view support"

# Bug fix
git commit -m "fix(auth): handle expired token refresh"

# Documentation
git commit -m "docs(readme): update installation instructions"

# Breaking change
git commit -m "feat(api): change event data structure

BREAKING CHANGE: Event.date is now Event.startDate"
```

#### Pull Request Process

1. **Before Submitting**
   - Update documentation if needed
   - Add tests for new features
   - Run linter: `npm run lint`
   - Run tests: `npm test`
   - Build successfully: `npm run build`
   - Test in actual Obsidian vault

2. **PR Description Template**

   ```markdown
   ## Description

   Brief description of changes

   ## Type of Change

   - [ ] Bug fix (non-breaking change which fixes an issue)
   - [ ] New feature (non-breaking change which adds functionality)
   - [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
   - [ ] Documentation update

   ## Testing

   - [ ] Unit tests pass
   - [ ] Integration tests pass
   - [ ] Manual testing completed
   - [ ] Tested in multiple Obsidian vaults

   ## Checklist

   **Code Quality:**

   - [ ] My code follows the style guidelines
   - [ ] I have performed a self-review
   - [ ] I have commented my code, particularly in hard-to-understand areas
   - [ ] My changes generate no new warnings
   - [ ] ESLint passes (`npm run lint`)
   - [ ] Prettier formatted (`npm run format`)
   - [ ] TypeScript compiles (`npm run build`)

   **Test-Driven Development (TDD) - MANDATORY:**

   - [ ] **I wrote tests BEFORE implementing the feature**
   - [ ] All tests pass (`npm test`)
   - [ ] Coverage meets 70% minimum threshold
   - [ ] Critical paths have 100% coverage (if applicable)
   - [ ] Test includes edge cases and error scenarios
   - [ ] Integration tests pass
   - [ ] Manual testing completed in test vault

   **Documentation:**

   - [ ] I have made corresponding changes to the documentation
   - [ ] Updated CHANGELOG.md with changes
   - [ ] Added inline code documentation
   - [ ] Updated relevant README sections

   ## Screenshots (if applicable)

   ## Related Issues

   Closes #(issue number)
   ```

3. **Review Process**
   - At least one maintainer review required
   - All CI checks must pass
   - Address review feedback promptly
   - Keep PRs focused and reasonably sized

4. **After Approval**
   - Squash commits if requested
   - Maintainer will merge when ready

## 🏗️ Project Architecture

### Key Components

```
src/
├── main.ts                  # Plugin entry, initialization
├── auth/
│   ├── GoogleAuth.ts       # OAuth flow implementation
│   └── TokenManager.ts     # Secure token storage
├── api/
│   └── CalendarAPI.ts      # Google Calendar API wrapper
├── ui/
│   ├── Timeline.ts         # Timeline rendering
│   ├── SettingsTab.ts      # Plugin settings UI
│   └── EventModal.ts       # Event detail views
├── services/
│   ├── SyncService.ts      # Background sync logic
│   └── NoteCreator.ts      # Note generation from events
└── types/
    └── calendar.ts         # Type definitions
```

### Design Patterns

- **Dependency Injection**: Use for testability
- **Observer Pattern**: For event synchronization
- **Factory Pattern**: For creating notes and UI components
- **Singleton**: For services (API, Auth)

### State Management

- Use Obsidian's API for persistent state
- In-memory caching for performance
- Clear separation between UI and business logic

## 🔧 Development Tools

### Useful Commands

```bash
# Development mode with hot reload
npm run dev

# Production build
npm run build

# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format

# Type check
npm run type-check

# Run all tests
npm test

# Run tests in watch mode
npm test:watch

# Generate test coverage
npm run test:coverage

# Bundle analyzer
npm run analyze
```

### Debugging

1. **Enable Developer Tools in Obsidian**
   - Press `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Option+I` (macOS)

2. **Add Debug Logging**

   ```typescript
   if (this.plugin.settings.debugMode) {
   	console.log('[GCal]', 'Debug info:', data);
   }
   ```

3. **Use Source Maps**
   - Development builds include source maps
   - Set breakpoints in TypeScript files

## 📚 Resources

- [Obsidian Plugin API](https://github.com/obsidianmd/obsidian-api)
- [Google Calendar API Documentation](https://developers.google.com/calendar)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [OAuth 2.0 Guide](https://oauth.net/2/)

## 🤔 Questions?

- Check [existing issues](https://github.com/mehmedmaljoki/google-calender-timeline/issues)
- Start a [discussion](https://github.com/mehmedmaljoki/google-calender-timeline/discussions)
- Join our community chat (if available)

## 🎉 Recognition

Contributors will be:

- Listed in [README.md](README.md)
- Acknowledged in release notes
- Eligible for "Contributor" badge
- Our eternal gratitude! 🙏

Thank you for contributing to Google Calendar Timeline! 🚀
