# Test-Driven Development (TDD) Guide

## 🎯 Philosophy

**Test-Driven Development is MANDATORY for this project.**

Before submitting to the Obsidian Marketplace, all features must:

- ✅ Have tests written BEFORE implementation
- ✅ Pass all tests
- ✅ Meet coverage thresholds (70% minimum, 100% for critical paths)
- ✅ Be manually verified in a test vault

## 🔴🟢🔵 The TDD Cycle

### Red-Green-Refactor

```
🔴 RED    → Write a failing test
🟢 GREEN  → Write minimal code to pass
🔵 REFACTOR → Improve code quality
```

**Repeat this cycle for EVERY feature, bug fix, and refactoring.**

---

## 📝 Step-by-Step TDD Process

### Example: Adding Event Filtering Feature

#### Step 1: Write the Test (RED)

**File**: `src/services/__tests__/SyncService.test.ts`

```typescript
import { SyncService } from '../SyncService';
import { createMockPlugin, createMockAPI, createMockEvent } from '../../__mocks__';

describe('SyncService', () => {
	describe('Event Filtering', () => {
		it('should filter events by calendar ID', async () => {
			// Arrange
			const mockPlugin = createMockPlugin();
			const mockAPI = createMockAPI();
			const service = new SyncService(mockPlugin, mockAPI);

			const event1 = createMockEvent({ calendarId: 'calendar-1', summary: 'Event 1' });
			const event2 = createMockEvent({ calendarId: 'calendar-2', summary: 'Event 2' });

			mockAPI.listEventsForMultipleCalendars.mockResolvedValue(
				new Map([
					['calendar-1', [event1]],
					['calendar-2', [event2]],
				])
			);

			await service.syncNow();

			// Act
			const filtered = service.getEventsByCalendar('calendar-1');

			// Assert
			expect(filtered).toHaveLength(1);
			expect(filtered[0].summary).toBe('Event 1');
			expect(filtered[0].calendarId).toBe('calendar-1');
		});

		it('should return empty array for non-existent calendar', () => {
			const mockPlugin = createMockPlugin();
			const mockAPI = createMockAPI();
			const service = new SyncService(mockPlugin, mockAPI);

			const filtered = service.getEventsByCalendar('non-existent');

			expect(filtered).toEqual([]);
		});
	});
});
```

#### Step 2: Run Test (Should FAIL)

```bash
npm test

# Expected output:
# FAIL  src/services/__tests__/SyncService.test.ts
#   ● SyncService › Event Filtering › should filter events by calendar ID
#     TypeError: service.getEventsByCalendar is not a function
```

✅ **Test fails as expected** - Method doesn't exist yet!

#### Step 3: Implement Minimal Code (GREEN)

**File**: `src/services/SyncService.ts`

```typescript
export class SyncService implements ISyncService {
	private events: Map<string, CalendarEvent[]> = new Map();

	// ... existing code ...

	/**
	 * Get events for a specific calendar
	 */
	getEventsByCalendar(calendarId: string): CalendarEvent[] {
		return this.events.get(calendarId) || [];
	}
}
```

#### Step 4: Run Test Again (Should PASS)

```bash
npm test

# Expected output:
# PASS  src/services/__tests__/SyncService.test.ts
#   ✓ should filter events by calendar ID (25ms)
#   ✓ should return empty array for non-existent calendar (3ms)
```

✅ **Tests pass!** - Feature works as expected.

#### Step 5: Refactor (Keep GREEN)

```typescript
export class SyncService implements ISyncService {
	private events: Map<string, CalendarEvent[]> = new Map();

	/**
	 * Get events for a specific calendar
	 * @param calendarId - Calendar ID to filter by
	 * @returns Array of events for the specified calendar
	 */
	getEventsByCalendar(calendarId: string): CalendarEvent[] {
		const events = this.events.get(calendarId);

		if (!events) {
			console.debug(`No events found for calendar: ${calendarId}`);
			return [];
		}

		return [...events]; // Return copy to prevent mutation
	}
}
```

Run tests again:

```bash
npm test
# ✓ All tests still pass!
```

---

## 🧪 Test Structure Best Practices

### Arrange-Act-Assert Pattern

```typescript
it('should do something', () => {
	// Arrange - Set up test data
	const input = 'test';
	const expected = 'TEST';

	// Act - Execute the code
	const result = transform(input);

	// Assert - Verify the result
	expect(result).toBe(expected);
});
```

### Test Organization

```
src/
├── services/
│   ├── SyncService.ts
│   └── __tests__/
│       └── SyncService.test.ts
├── api/
│   ├── CalendarAPI.ts
│   └── __tests__/
│       └── CalendarAPI.test.ts
└── __mocks__/
    ├── obsidian.ts
    ├── googleAPI.ts
    └── factories.ts
```

### Mock Factories

**File**: `src/__mocks__/factories.ts`

```typescript
import { CalendarEvent, Calendar } from '../types/calendar';

export function createMockEvent(overrides?: Partial<CalendarEvent>): CalendarEvent {
	return {
		id: 'event-123',
		summary: 'Mock Event',
		start: { dateTime: '2024-01-15T10:00:00Z' },
		end: { dateTime: '2024-01-15T11:00:00Z' },
		calendarId: 'primary',
		htmlLink: 'https://calendar.google.com/event?eid=123',
		created: '2024-01-01T00:00:00Z',
		updated: '2024-01-01T00:00:00Z',
		...overrides,
	};
}

export function createMockCalendar(overrides?: Partial<Calendar>): Calendar {
	return {
		id: 'primary',
		summary: 'Primary Calendar',
		primary: true,
		backgroundColor: '#9E69AF',
		foregroundColor: '#FFFFFF',
		...overrides,
	};
}

export function createMockPlugin() {
	return {
		settings: {
			autoSync: true,
			syncInterval: 15,
			// ... other settings
		},
		saveSettings: jest.fn(),
		app: {
			workspace: {},
			vault: {},
		},
	};
}

export function createMockAPI() {
	return {
		listCalendars: jest.fn(),
		listEvents: jest.fn(),
		listEventsForMultipleCalendars: jest.fn(),
		getEvent: jest.fn(),
	};
}
```

---

## 📊 Coverage Requirements

### Minimum Coverage Thresholds

```javascript
// jest.config.js
coverageThreshold: {
  global: {
    branches: 70,
    functions: 70,
    lines: 70,
    statements: 70
  }
}
```

### Critical Paths (100% Coverage Required)

- **Authentication**: `src/auth/*`
- **API Calls**: `src/api/*`
- **Data Synchronization**: `src/services/SyncService.ts`
- **Error Handling**: All error paths

### Run Coverage Report

```bash
npm test -- --coverage

# Output:
# ----------------------|---------|----------|---------|---------|
# File                  | % Stmts | % Branch | % Funcs | % Lines |
# ----------------------|---------|----------|---------|---------|
# All files             |   85.23 |    78.45 |   82.15 |   85.67 |
#  auth/                |   92.15 |    87.50 |   90.00 |   92.15 |
#   GoogleAuth.ts       |   95.00 |    90.00 |   92.00 |   95.00 |
#   TokenManager.ts     |   88.50 |    85.00 |   88.00 |   88.50 |
#  api/                 |   89.67 |    82.35 |   85.71 |   90.12 |
#   CalendarAPI.ts      |   89.67 |    82.35 |   85.71 |   90.12 |
# ----------------------|---------|----------|---------|---------|
```

---

## 🎯 What to Test

### Unit Tests

**Test Individual Functions/Methods**

```typescript
describe('NoteCreator', () => {
	describe('generateFilename', () => {
		it('should use event title by default', () => {
			const creator = new NoteCreator(mockApp, mockSettings);
			const event = createMockEvent({ summary: 'Team Meeting' });

			const filename = creator.generateFilename(event);

			expect(filename).toBe('Team Meeting.md');
		});

		it('should sanitize invalid characters', () => {
			const creator = new NoteCreator(mockApp, mockSettings);
			const event = createMockEvent({ summary: 'Meeting: <Important>' });

			const filename = creator.generateFilename(event);

			expect(filename).toBe('Meeting- -Important-.md');
			expect(filename).not.toMatch(/[<>:"|?*]/);
		});

		it('should use custom template when configured', () => {
			const settings = {
				...mockSettings,
				fileNamingStrategy: 'custom',
				customFileNameTemplate: '{{date}}-{{title}}',
			};
			const creator = new NoteCreator(mockApp, settings);
			const event = createMockEvent({
				summary: 'Meeting',
				start: { dateTime: '2024-01-15T10:00:00Z' },
			});

			const filename = creator.generateFilename(event);

			expect(filename).toBe('2024-01-15-Meeting.md');
		});
	});
});
```

### Integration Tests

**Test Multiple Components Together**

```typescript
describe('Calendar Sync Integration', () => {
	it('should sync events and make them available for timeline', async () => {
		// Arrange
		const mockPlugin = createMockPlugin();
		const mockAPI = createMockAPI();
		const syncService = new SyncService(mockPlugin, mockAPI);
		const timelineView = new TimelineView(mockLeaf, mockPlugin);

		const events = [
			createMockEvent({ summary: 'Event 1' }),
			createMockEvent({ summary: 'Event 2' }),
		];

		mockAPI.listEventsForMultipleCalendars.mockResolvedValue(new Map([['primary', events]]));

		// Act
		await syncService.syncNow();
		const timelineEvents = await timelineView.getVisibleEvents();

		// Assert
		expect(timelineEvents).toHaveLength(2);
		expect(syncService.getState().status).toBe('idle');
	});
});
```

### Error Handling Tests

**Test Error Scenarios**

```typescript
describe('Error Handling', () => {
	it('should handle authentication errors gracefully', async () => {
		const mockAPI = createMockAPI();
		mockAPI.listEvents.mockRejectedValue(new AuthenticationError('Token expired'));

		const service = new SyncService(mockPlugin, mockAPI);

		await expect(service.syncNow()).rejects.toThrow(AuthenticationError);
		expect(service.getState().status).toBe('error');
		expect(service.getState().lastError).toBe('Token expired');
	});

	it('should retry on network errors', async () => {
		const mockAPI = createMockAPI();
		mockAPI.listEvents
			.mockRejectedValueOnce(new NetworkError('Connection failed'))
			.mockResolvedValueOnce([createMockEvent()]);

		const service = new SyncService(mockPlugin, mockAPI);

		const result = await service.syncWithRetry();

		expect(result).toBeDefined();
		expect(mockAPI.listEvents).toHaveBeenCalledTimes(2);
	});
});
```

---

## ⚠️ Common TDD Mistakes to Avoid

### ❌ Writing Implementation First

```typescript
// WRONG - Implementation before test
export class NoteCreator {
	generateFilename(event: CalendarEvent): string {
		return event.summary + '.md';
	}
}

// Then writing test
it('should generate filename', () => {
	// Test written after implementation
});
```

### ✅ Correct Approach

```typescript
// 1. Write test FIRST
it('should generate filename from event title', () => {
	const filename = creator.generateFilename(mockEvent);
	expect(filename).toBe('Meeting.md');
});

// 2. THEN implement
export class NoteCreator {
	generateFilename(event: CalendarEvent): string {
		return event.summary + '.md';
	}
}
```

### ❌ Testing Implementation Details

```typescript
// WRONG - Testing private methods
it('should call private method', () => {
	const spy = jest.spyOn(service as any, '_privateMethod');
	service.publicMethod();
	expect(spy).toHaveBeenCalled();
});
```

### ✅ Test Public Behavior

```typescript
// CORRECT - Test observable behavior
it('should process events correctly', async () => {
	const result = await service.processEvents(events);
	expect(result).toHaveLength(5);
	expect(result[0].processed).toBe(true);
});
```

### ❌ Too Many Assertions

```typescript
// WRONG - Testing multiple things
it('should do everything', () => {
	const result = service.doStuff();
	expect(result.name).toBe('test');
	expect(result.count).toBe(5);
	expect(result.items).toHaveLength(10);
	expect(result.valid).toBe(true);
	// Too many things tested!
});
```

### ✅ One Concept Per Test

```typescript
// CORRECT - Focused tests
describe('Service Results', () => {
	it('should set correct name', () => {
		expect(result.name).toBe('test');
	});

	it('should count items correctly', () => {
		expect(result.count).toBe(5);
	});

	it('should validate items', () => {
		expect(result.valid).toBe(true);
	});
});
```

---

## 🚀 Running Tests

### All Tests

```bash
npm test
```

### Watch Mode (During Development)

```bash
npm test -- --watch
```

### Specific File

```bash
npm test -- SyncService.test.ts
```

### With Coverage

```bash
npm test -- --coverage
```

### Coverage Report (HTML)

```bash
npm test -- --coverage --coverageReporters=html
# Open coverage/index.html in browser
```

---

## 📋 Pre-Marketplace Checklist

Before submitting to Obsidian Community Plugins:

### Test Requirements

- [ ] All unit tests passing (`npm test`)
- [ ] Coverage meets thresholds (70% minimum)
- [ ] Critical paths have 100% coverage
- [ ] Integration tests passing
- [ ] Error scenarios tested
- [ ] Edge cases covered

### Code Quality

- [ ] ESLint passes (`npm run lint`)
- [ ] Prettier formatted (`npm run format`)
- [ ] TypeScript compiles (`npm run build`)
- [ ] No console errors in test vault

### Manual Testing

- [ ] Authentication flow works
- [ ] Sync functionality verified
- [ ] Timeline displays correctly
- [ ] Note creation tested
- [ ] Settings save properly
- [ ] All commands execute

### Documentation

- [ ] All tests documented
- [ ] README updated
- [ ] CHANGELOG updated
- [ ] Coverage report generated

---

## 🎓 TDD Resources

### Internal Documentation

- [Development Guide](DEVELOPMENT.md)
- [Architecture](ARCHITECTURE.md)
- [Contributing](../CONTRIBUTING.md)

### External Resources

- [Jest Documentation](https://jestjs.io/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [TDD by Example](https://www.amazon.com/Test-Driven-Development-Kent-Beck/dp/0321146530)

---

## 💡 Remember

> **"Tests are not about finding bugs. Tests are about designing good APIs and ensuring your code does what you think it does."**

**Write the test. Watch it fail. Make it pass. Refactor. Repeat.**

🔴 → 🟢 → 🔵 → ✅

---

**Questions?** Open a discussion on GitHub: [Discussions](https://github.com/mehmedmaljoki/google-calendar-timeline/discussions)
