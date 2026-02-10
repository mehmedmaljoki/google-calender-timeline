# GitHub Copilot Instructions

## Project Context

This is **Google Calendar Timeline**, an Obsidian plugin that integrates Google Calendar with a visual timeline interface.

## Core Technologies

- **TypeScript 5.x** - Main language
- **Obsidian API** - Plugin framework
- **Google Calendar API** - Calendar data access
- **vis-timeline** - Timeline visualization library
- **OAuth 2.0** - Authentication
- **ESBuild** - Build tool
- **Jest** - Testing framework

## Development Philosophy

### Test-Driven Development (TDD)

**⚠️ CRITICAL: Always follow TDD when implementing new features!**

Before any feature implementation or code change:

1. **Write Tests First** - Define expected behavior
2. **Run Tests (Red)** - Verify tests fail as expected
3. **Implement Feature** - Write minimal code to pass tests
4. **Run Tests (Green)** - Verify all tests pass
5. **Refactor** - Improve code while keeping tests green

**Never skip TDD for:**

- New features
- Bug fixes
- Refactoring existing code
- API integrations
- UI components with logic

**TDD Workflow Example:**

```typescript
// 1. Write test FIRST
describe('SyncService', () => {
	it('should fetch events from multiple calendars', async () => {
		const mockAPI = createMockAPI();
		const service = new SyncService(mockPlugin, mockAPI);

		const events = await service.syncNow();

		expect(events.size).toBeGreaterThan(0);
		expect(mockAPI.listEventsForMultipleCalendars).toHaveBeenCalled();
	});
});

// 2. Run test (should FAIL)
// npm test

// 3. Implement feature
export class SyncService {
	async syncNow(): Promise<Map<string, CalendarEvent[]>> {
		const events = await this.api.listEventsForMultipleCalendars();
		// ... implementation
		return events;
	}
}

// 4. Run test (should PASS)
// npm test

// 5. Refactor if needed
```

**Test Coverage Requirements:**

- Minimum 70% code coverage for all modules
- 100% coverage for critical paths (auth, API calls, data sync)
- Test edge cases and error scenarios
- Mock external dependencies (Google API, Obsidian API)

**Before Marketplace Submission:**

- ✅ All tests passing
- ✅ Coverage thresholds met
- ✅ Integration tests complete
- ✅ Manual testing in test vault

## Code Style & Standards

### TypeScript Conventions

```typescript
// ✅ Prefer explicit types
async function fetchEvents(calendarId: string, dateRange: DateRange): Promise<CalendarEvent[]>;

// ✅ Use interfaces for shapes
interface CalendarEvent {
	id: string;
	summary: string;
	start: EventDateTime;
	end: EventDateTime;
}

// ✅ Use enums for constants
enum SyncStatus {
	Idle = 'idle',
	Syncing = 'syncing',
	Error = 'error',
}

// ❌ Avoid 'any' type
// ❌ Don't use var, always use const/let
// ❌ Avoid implicit returns in complex functions
```

### Naming Conventions

- **Classes**: PascalCase (`CalendarAPI`, `SyncService`)
- **Interfaces**: PascalCase with 'I' prefix for service interfaces (`ICalendarAPI`)
- **Functions/Methods**: camelCase (`fetchEvents`, `createNote`)
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_SYNC_INTERVAL`)
- **Private members**: prefix with underscore (`_token`, `_cache`)
- **Files**: camelCase for TS, kebab-case for CSS (`SyncService.ts`, `timeline-view.css`)

### Architecture Patterns

**Dependency Injection**

```typescript
class SyncService {
	constructor(
		private api: ICalendarAPI,
		private storage: IStorage,
		private logger: ILogger
	) {}
}
```

**Error Handling**

```typescript
try {
	const events = await this.api.fetchEvents(calendarId);
	return events;
} catch (error) {
	if (error instanceof AuthenticationError) {
		await this.handleAuthError(error);
	} else if (error instanceof NetworkError) {
		this.logger.error('Network error', error);
		this.notifyUser('Unable to sync. Check connection.');
	}
	throw error;
}
```

**Async/Await over Promises**

```typescript
// ✅ Good
async function syncCalendars(): Promise<void> {
	const calendars = await this.api.listCalendars();
	const events = await Promise.all(calendars.map(cal => this.api.listEvents(cal.id)));
}

// ❌ Avoid
function syncCalendars(): Promise<void> {
	return this.api.listCalendars().then(calendars => {
		return Promise.all(calendars.map(cal => this.api.listEvents(cal.id)));
	});
}
```

## Project Structure

```
src/
├── main.ts              # Plugin entry point - registers commands, initializes services
├── auth/
│   ├── GoogleAuth.ts    # OAuth 2.0 implementation
│   └── TokenManager.ts  # Secure token storage
├── api/
│   └── CalendarAPI.ts   # Google Calendar API wrapper with error handling
├── ui/
│   ├── Timeline.ts      # Timeline view using vis-timeline
│   ├── SettingsTab.ts   # Plugin settings UI
│   └── EventModal.ts    # Event details modal
├── services/
│   ├── SyncService.ts   # Background sync orchestration
│   └── NoteCreator.ts   # Markdown note generation
└── types/
    └── calendar.ts      # Type definitions and interfaces
```

## Common Patterns

### Obsidian Plugin Pattern

```typescript
export default class GoogleCalendarPlugin extends Plugin {
	settings: PluginSettings;

	async onload() {
		await this.loadSettings();

		// Initialize services
		this.authService = new GoogleAuth(this);
		this.apiService = new CalendarAPI(this.authService);

		// Register views
		this.registerView(VIEW_TYPE_TIMELINE, leaf => new TimelineView(leaf, this));

		// Register commands
		this.addCommand({
			id: 'open-timeline',
			name: 'Open Timeline',
			callback: () => this.activateView(),
		});

		// Add settings tab
		this.addSettingTab(new SettingsTab(this.app, this));
	}

	async onunload() {
		// Cleanup
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_TIMELINE);
	}
}
```

### Google Calendar API Integration

```typescript
class CalendarAPI {
	async listEvents(calendarId: string, timeMin: Date, timeMax: Date): Promise<CalendarEvent[]> {
		const token = await this.auth.getAccessToken();

		const response = await fetch(
			`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?` +
				`timeMin=${timeMin.toISOString()}&timeMax=${timeMax.toISOString()}`,
			{
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			}
		);

		if (!response.ok) {
			throw new APIError(`Failed to fetch events: ${response.statusText}`);
		}

		const data = await response.json();
		return this.transformEvents(data.items);
	}
}
```

### Note Creation Pattern

```typescript
class NoteCreator {
	async createNote(event: CalendarEvent): Promise<TFile> {
		const filename = this.generateFilename(event);
		const content = this.generateContent(event);

		// Check for existing note
		const existingFile = this.app.vault.getAbstractFileByPath(filename);
		if (existingFile instanceof TFile) {
			const overwrite = await this.confirmOverwrite(filename);
			if (!overwrite) return existingFile;
		}

		// Create note
		const file = await this.app.vault.create(filename, content);

		// Open note (optional)
		const leaf = this.app.workspace.getLeaf(false);
		await leaf.openFile(file);

		return file;
	}

	private generateContent(event: CalendarEvent): string {
		const template = this.settings.noteTemplate;
		return template
			.replace('{{title}}', event.summary)
			.replace('{{date}}', this.formatDate(event.start.dateTime))
			.replace('{{description}}', event.description || '')
			.replace('{{location}}', event.location || 'N/A')
			.replace('{{attendees}}', this.formatAttendees(event.attendees));
	}
}
```

## Security Best Practices

### Token Handling

```typescript
// ✅ Store tokens securely
class TokenManager {
	async saveToken(token: OAuthToken): Promise<void> {
		// Use Obsidian's secure storage
		await this.plugin.saveData({
			...this.plugin.settings,
			oauthToken: token, // Encrypted by Obsidian
		});
	}

	// ❌ NEVER log tokens
	// console.log('Token:', token); // DON'T DO THIS
}
```

### Input Sanitization

```typescript
// ✅ Sanitize user input for filenames
private sanitizeFilename(input: string): string {
    return input
        .replace(/[<>:"/\\|?*]/g, '-') // Remove invalid chars
        .replace(/\s+/g, ' ')           // Normalize whitespace
        .trim()
        .substring(0, 200);              // Limit length
}

// ✅ Escape markdown content
private escapeMarkdown(text: string): string {
    return text.replace(/([\\`*_{}[\]()#+\-.!])/g, '\\$1');
}
```

## Testing Guidelines

### Test-Driven Development Workflow

**⚠️ MANDATORY: Write tests BEFORE implementing any feature!**

```typescript
// Step 1: Write the test (it should FAIL)
describe('NoteCreator', () => {
	it('should sanitize invalid filename characters', () => {
		const creator = new NoteCreator(mockApp, mockSettings);
		const event = createMockEvent({ summary: 'Meeting: <Team> | Sync?' });

		const filename = creator.generateFilename(event);

		expect(filename).toBe('Meeting- -Team- - Sync-.md');
		expect(filename).not.toMatch(/[<>:|?*]/);
	});
});

// Step 2: Run test - npm test (should FAIL/RED)

// Step 3: Implement the feature
class NoteCreator {
	generateFilename(event: CalendarEvent): string {
		const sanitized = event.summary
			.replace(/[<>:"|?*]/g, '-') // Remove invalid chars
			.replace(/\s+/g, ' ')
			.trim();
		return `${sanitized}.md`;
	}
}

// Step 4: Run test - npm test (should PASS/GREEN)

// Step 5: Refactor if needed (tests stay GREEN)
```

**TDD Checklist for Every Feature:**

- [ ] Write test first
- [ ] Verify test fails (RED)
- [ ] Implement minimal code to pass
- [ ] Verify test passes (GREEN)
- [ ] Refactor while keeping tests green
- [ ] Run full test suite before commit

### Unit Test Structure

```typescript
describe('CalendarAPI', () => {
	let api: CalendarAPI;
	let mockAuth: jest.Mocked<IAuth>;

	beforeEach(() => {
		mockAuth = createMockAuth();
		api = new CalendarAPI(mockAuth);
	});

	describe('listEvents', () => {
		it('should fetch and transform events', async () => {
			mockAuth.getAccessToken.mockResolvedValue('token123');

			const events = await api.listEvents(
				'primary',
				new Date('2024-01-01'),
				new Date('2024-01-31')
			);

			expect(events).toHaveLength(5);
			expect(events[0]).toMatchObject({
				id: expect.any(String),
				summary: expect.any(String),
				start: expect.any(Object),
			});
		});

		it('should handle API errors gracefully', async () => {
			mockAuth.getAccessToken.mockRejectedValue(new AuthError());

			await expect(api.listEvents('primary', new Date(), new Date())).rejects.toThrow(AuthError);
		});
	});
});
```

## Common Tasks

### Adding a New Command

```typescript
this.addCommand({
	id: 'sync-now',
	name: 'Sync calendars now',
	icon: 'refresh-cw',
	callback: async () => {
		try {
			new Notice('Syncing calendars...');
			await this.syncService.syncNow();
			new Notice('Sync completed successfully');
		} catch (error) {
			new Notice('Sync failed: ' + error.message);
			console.error('Sync error:', error);
		}
	},
});
```

### Adding a New Setting

```typescript
new Setting(containerEl)
	.setName('Sync interval')
	.setDesc('How often to sync with Google Calendar (minutes)')
	.addText(text =>
		text
			.setPlaceholder('15')
			.setValue(String(this.plugin.settings.syncInterval))
			.onChange(async value => {
				const interval = parseInt(value) || 15;
				this.plugin.settings.syncInterval = interval;
				await this.plugin.saveSettings();
				this.plugin.syncService.restartAutoSync();
			})
	);
```

### Creating a Custom View

```typescript
export class TimelineView extends ItemView {
	getViewType(): string {
		return VIEW_TYPE_TIMELINE;
	}

	getDisplayText(): string {
		return 'Calendar Timeline';
	}

	getIcon(): string {
		return 'calendar';
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		container.empty();
		container.createEl('h4', { text: 'Calendar Timeline' });

		// Initialize timeline
		this.timeline = new Timeline(container, this.events, this.options);
	}

	async onClose() {
		this.timeline?.destroy();
	}
}
```

## Performance Optimization

### Debouncing

```typescript
import { debounce } from 'obsidian';

// Debounce expensive operations
this.debouncedSync = debounce(
	() => this.syncService.syncNow(),
	5000,
	true // leading edge
);
```

### Caching

```typescript
class CacheService {
	private cache = new Map<string, CacheEntry>();
	private readonly TTL = 15 * 60 * 1000; // 15 minutes

	get(key: string): any | null {
		const entry = this.cache.get(key);
		if (!entry) return null;

		if (Date.now() - entry.timestamp > this.TTL) {
			this.cache.delete(key);
			return null;
		}

		return entry.data;
	}

	set(key: string, data: any): void {
		this.cache.set(key, {
			data,
			timestamp: Date.now(),
		});
	}
}
```

## Important Notes

- **Always use TypeScript strict mode**
- **Follow TDD for ALL features** - Write tests before implementation
- **Test coverage minimum 70%** - Critical paths need 100%
- **Handle errors at appropriate levels** - don't let errors bubble up without context
- **Use Obsidian's Notice for user feedback** - keep users informed
- **Respect user privacy** - never send data to external servers
- **Test OAuth flow thoroughly** - auth errors are hard to debug
- **Cache aggressively** - reduce API calls to stay within rate limits
- **Use semantic versioning** - for manifest.json and releases
- **Document breaking changes** - in CHANGELOG.md
- **Before marketplace submission** - ensure all tests pass and coverage meets thresholds

## TDD Reminders

🔴 **RED** → Write failing test
🟢 **GREEN** → Make it pass
🔵 **REFACTOR** → Improve code

**Every feature starts with a test. No exceptions.**

## References

- [Obsidian API Docs](https://github.com/obsidianmd/obsidian-api)
- [Google Calendar API](https://developers.google.com/calendar/api/guides/overview)
- [OAuth 2.0 Spec](https://oauth.net/2/)
- [vis-timeline Docs](https://visjs.github.io/vis-timeline/docs/timeline/)

---

When generating code, follow these patterns and conventions. Prioritize type safety, error handling, and user experience.
