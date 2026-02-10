/**
 * Test Data Factories
 * Create mock objects for testing
 */

import { Calendar, CalendarEvent, OAuthToken, PluginSettings } from '../types/calendar';

export function createMockEvent(overrides?: Partial<CalendarEvent>): CalendarEvent {
	return {
		id: 'event-123',
		summary: 'Mock Event',
		description: 'Mock event description',
		location: 'Mock Location',
		start: {
			dateTime: '2024-01-15T10:00:00Z',
			timeZone: 'UTC',
		},
		end: {
			dateTime: '2024-01-15T11:00:00Z',
			timeZone: 'UTC',
		},
		calendarId: 'primary',
		htmlLink: 'https://calendar.google.com/event?eid=123',
		status: 'confirmed',
		created: '2024-01-01T00:00:00Z',
		updated: '2024-01-01T00:00:00Z',
		...overrides,
	};
}

export function createMockCalendar(overrides?: Partial<Calendar>): Calendar {
	return {
		id: 'primary',
		summary: 'Primary Calendar',
		backgroundColor: '#9E69AF',
		foregroundColor: '#FFFFFF',
		selected: true,
		timeZone: 'UTC',
		accessRole: 'owner',
		primary: true,
		...overrides,
	};
}

export function createMockToken(overrides?: Partial<OAuthToken>): OAuthToken {
	return {
		access_token: 'mock_access_token_123',
		refresh_token: 'mock_refresh_token_456',
		token_type: 'Bearer',
		expires_in: 3600,
		expires_at: Date.now() + 3600 * 1000,
		scope: 'https://www.googleapis.com/auth/calendar.readonly',
		...overrides,
	};
}

export function createMockSettings(overrides?: Partial<PluginSettings>): PluginSettings {
	return {
		syncInterval: 15,
		autoSync: true,
		selectedCalendars: [],
		useGoogleColors: true,
		maxEventsPerCalendar: 1000,
		defaultView: 'day',
		showPastEvents: true,
		showWeekends: true,
		startHour: 8,
		endHour: 20,
		noteTemplate: '# {{title}}\n\n{{description}}',
		noteLocation: '',
		fileNamingStrategy: 'date-title',
		openNoteAfterCreation: true,
		debugMode: false,
		cacheEnabled: true,
		cacheTTL: 15,
		...overrides,
	};
}

export function createMockPlugin() {
	return {
		settings: createMockSettings(),
		saveData: jest.fn().mockResolvedValue(undefined),
		loadData: jest.fn().mockResolvedValue({}),
		app: {
			workspace: {
				getLeavesOfType: jest.fn().mockReturnValue([]),
				trigger: jest.fn(),
				getLeaf: jest.fn().mockReturnValue({
					openFile: jest.fn(),
				}),
			},
			vault: {
				getAbstractFileByPath: jest.fn().mockReturnValue(null),
				create: jest.fn().mockResolvedValue({
					name: 'test.md',
					path: 'test.md',
				}),
				delete: jest.fn().mockResolvedValue(undefined),
			},
		},
	};
}

export function createMockAuth() {
	return {
		login: jest.fn().mockResolvedValue(undefined),
		logout: jest.fn().mockResolvedValue(undefined),
		getAccessToken: jest.fn().mockResolvedValue('mock_access_token'),
		refreshToken: jest.fn().mockResolvedValue('mock_refreshed_token'),
		isAuthenticated: jest.fn().mockReturnValue(true),
		revokeToken: jest.fn().mockResolvedValue(undefined),
	};
}

export function createMockAPI() {
	return {
		listCalendars: jest.fn().mockResolvedValue([createMockCalendar()]),
		listEvents: jest.fn().mockResolvedValue([createMockEvent()]),
		getEvent: jest.fn().mockResolvedValue(createMockEvent()),
		listEventsForMultipleCalendars: jest
			.fn()
			.mockResolvedValue(new Map([['primary', [createMockEvent()]]])),
		getCalendarColors: jest.fn().mockResolvedValue({}),
		testConnection: jest.fn().mockResolvedValue(true),
		getUserTimeZone: jest.fn().mockResolvedValue('UTC'),
	};
}

export function createMockTokenManager() {
	return {
		saveToken: jest.fn().mockResolvedValue(undefined),
		getToken: jest.fn().mockResolvedValue(createMockToken()),
		getTokenSync: jest.fn().mockReturnValue(createMockToken()),
		clearToken: jest.fn().mockResolvedValue(undefined),
		isTokenExpired: jest.fn().mockReturnValue(false),
		isTokenExpiringSoon: jest.fn().mockReturnValue(false),
		getTokenExpirationTime: jest.fn().mockReturnValue(new Date(Date.now() + 3600000)),
		getTokenRemainingLifetime: jest.fn().mockReturnValue(3600),
		isValidToken: jest.fn().mockReturnValue(true),
		initialize: jest.fn().mockResolvedValue(undefined),
	};
}
