/**
 * Google Calendar Event Types
 */

export interface CalendarEvent {
	id: string;
	summary: string;
	description?: string;
	location?: string;
	start: EventDateTime;
	end: EventDateTime;
	attendees?: Attendee[];
	calendarId: string;
	colorId?: string;
	htmlLink: string;
	recurrence?: string[];
	status?: 'confirmed' | 'tentative' | 'cancelled';
	created?: string;
	updated?: string;
	creator?: EventPerson;
	organizer?: EventPerson;
}

export interface EventDateTime {
	dateTime?: string;
	date?: string;
	timeZone?: string;
}

export interface Attendee {
	email: string;
	displayName?: string;
	responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
	optional?: boolean;
	organizer?: boolean;
	self?: boolean;
}

export interface EventPerson {
	email?: string;
	displayName?: string;
	self?: boolean;
}

/**
 * Google Calendar Types
 */

export interface Calendar {
	id: string;
	summary: string;
	description?: string;
	backgroundColor: string;
	foregroundColor: string;
	selected: boolean;
	timeZone?: string;
	accessRole?: string;
	primary?: boolean;
}

export interface CalendarListEntry {
	id: string;
	summary: string;
	description?: string;
	backgroundColor: string;
	foregroundColor: string;
	timeZone?: string;
	accessRole?: 'freeBusyReader' | 'reader' | 'writer' | 'owner';
	primary?: boolean;
	deleted?: boolean;
	hidden?: boolean;
}

/**
 * OAuth Token Types
 */

export interface OAuthToken {
	access_token: string;
	refresh_token?: string;
	token_type: string;
	expires_in: number;
	expires_at?: number;
	scope?: string;
}

export interface OAuthConfig {
	clientId: string;
	clientSecret: string;
	redirectUri: string;
	scopes: string[];
}

/**
 * Plugin Settings Types
 */

export interface PluginSettings {
	// Authentication
	oauthToken?: OAuthToken;

	// Sync Settings
	syncInterval: number; // minutes
	lastSyncTime?: number;
	autoSync: boolean;

	// Calendar Settings
	selectedCalendars: string[];
	useGoogleColors: boolean;
	maxEventsPerCalendar: number;

	// Display Settings
	defaultView: 'day' | 'week' | 'month';
	showPastEvents: boolean;
	showWeekends: boolean;
	startHour: number;
	endHour: number;

	// Note Settings
	noteTemplate: string;
	noteLocation: string;
	fileNamingStrategy: 'title' | 'date-title' | 'custom';
	customFileNameTemplate?: string;
	openNoteAfterCreation: boolean;

	// Advanced Settings
	debugMode: boolean;
	cacheEnabled: boolean;
	cacheTTL: number; // minutes
}

export const DEFAULT_SETTINGS: PluginSettings = {
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
	noteTemplate: `---
created: {{date}}
type: calendar-event
calendar: {{calendar}}
---

# {{title}}

**When:** {{date}} at {{time}}
**Where:** {{location}}

## Attendees
{{attendees}}

## Description
{{description}}

## Notes


---
[Open in Google Calendar]({{link}})`,
	noteLocation: '',
	fileNamingStrategy: 'date-title',
	openNoteAfterCreation: true,
	debugMode: false,
	cacheEnabled: true,
	cacheTTL: 15,
};

/**
 * Sync Status Types
 */

export enum SyncStatus {
	Idle = 'idle',
	Syncing = 'syncing',
	Success = 'success',
	Error = 'error',
}

export interface SyncState {
	status: SyncStatus;
	lastSync?: Date;
	nextSync?: Date;
	error?: string;
	progress?: number;
}

/**
 * Error Types
 */

export class CalendarError extends Error {
	constructor(
		message: string,
		public code: string
	) {
		super(message);
		this.name = 'CalendarError';
	}
}

export class AuthenticationError extends CalendarError {
	constructor(message: string = 'Authentication failed') {
		super(message, 'AUTH_ERROR');
		this.name = 'AuthenticationError';
	}
}

export class NetworkError extends CalendarError {
	constructor(message: string = 'Network request failed') {
		super(message, 'NETWORK_ERROR');
		this.name = 'NetworkError';
	}
}

export class APIError extends CalendarError {
	constructor(
		message: string = 'API request failed',
		public statusCode?: number
	) {
		super(message, 'API_ERROR');
		this.name = 'APIError';
	}
}

export class ValidationError extends CalendarError {
	constructor(message: string = 'Validation failed') {
		super(message, 'VALIDATION_ERROR');
		this.name = 'ValidationError';
	}
}

/**
 * Cache Types
 */

export interface CacheEntry<T = any> {
	data: T;
	timestamp: number;
	ttl: number;
}

export interface Cache {
	get<T>(key: string): T | null;
	set<T>(key: string, data: T, ttl?: number): void;
	has(key: string): boolean;
	delete(key: string): void;
	clear(): void;
}

/**
 * Timeline Types
 */

export interface TimelineOptions {
	start: Date;
	end: Date;
	height?: string;
	minHeight?: string;
	maxHeight?: string;
	orientation?: 'top' | 'bottom' | 'both';
	showCurrentTime?: boolean;
	zoomable?: boolean;
	moveable?: boolean;
}

export interface TimelineItem {
	id: string;
	content: string;
	start: Date;
	end?: Date;
	group?: string;
	className?: string;
	style?: string;
	title?: string;
	editable?: boolean;
}

/**
 * API Response Types
 */

export interface GoogleCalendarListResponse {
	items: CalendarListEntry[];
	nextPageToken?: string;
}

export interface GoogleEventsListResponse {
	items: CalendarEvent[];
	nextPageToken?: string;
	nextSyncToken?: string;
}

/**
 * Logger Interface
 */

export interface ILogger {
	debug(message: string, ...args: any[]): void;
	info(message: string, ...args: any[]): void;
	warn(message: string, ...args: any[]): void;
	error(message: string, ...args: any[]): void;
}

/**
 * Service Interfaces
 */

export interface ICalendarAPI {
	listCalendars(): Promise<Calendar[]>;
	listEvents(calendarId: string, timeMin: Date, timeMax: Date): Promise<CalendarEvent[]>;
	getEvent(calendarId: string, eventId: string): Promise<CalendarEvent>;
}

export interface IAuth {
	login(): Promise<void>;
	logout(): Promise<void>;
	getAccessToken(): Promise<string>;
	refreshToken(): Promise<string>;
	isAuthenticated(): boolean;
}

export interface ISyncService {
	startAutoSync(): void;
	stopAutoSync(): void;
	syncNow(): Promise<void>;
	getStatus(): SyncState;
}

export interface INoteCreator {
	createNote(event: CalendarEvent): Promise<any>;
	generateContent(event: CalendarEvent): string;
	generateFilename(event: CalendarEvent): string;
}
