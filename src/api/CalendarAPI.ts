import { Notice, requestUrl } from 'obsidian';
import { GoogleAuth } from '../auth/GoogleAuth';
import {
	APIError,
	Attendee,
	AuthenticationError,
	Calendar,
	CalendarEvent,
	CalendarListEntry,
	EventPerson,
	GoogleCalendarListResponse,
	GoogleEventsListResponse,
	ICalendarAPI,
	NetworkError,
} from '../types/calendar';

interface GoogleCalendarEventDateTime {
	dateTime?: string;
	date?: string;
	timeZone?: string;
}

interface GoogleCalendarEvent {
	id: string;
	summary?: string;
	description?: string;
	location?: string;
	start: GoogleCalendarEventDateTime;
	end: GoogleCalendarEventDateTime;
	attendees?: Attendee[];
	calendarId?: string;
	colorId?: string;
	htmlLink: string;
	recurrence?: string[];
	status?: CalendarEvent['status'];
	created?: string;
	updated?: string;
	creator?: EventPerson;
	organizer?: EventPerson;
}

/**
 * Google Calendar API Wrapper
 * Handles all interactions with the Google Calendar API
 */
export class CalendarAPI implements ICalendarAPI {
	private auth: GoogleAuth;
	private readonly BASE_URL = 'https://www.googleapis.com/calendar/v3';

	constructor(auth: GoogleAuth) {
		this.auth = auth;
	}

	/**
	 * List all calendars for the authenticated user
	 */
	async listCalendars(): Promise<Calendar[]> {
		try {
			const token = await this.auth.getAccessToken();

			const response = await requestUrl({
				url: `${this.BASE_URL}/users/me/calendarList`,
				method: 'GET',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			if (response.status !== 200) {
				this.handleErrorResponse(response);
			}

			const data: GoogleCalendarListResponse = response.json;

			return data.items.map(cal => this.transformCalendar(cal));
		} catch (error) {
			console.error('Failed to fetch calendars:', error);
			if (error instanceof AuthenticationError) {
				new Notice('Authentication expired. Please log in again.');
			}
			throw error;
		}
	}

	/**
	 * List events for a specific calendar within a date range
	 */
	async listEvents(calendarId: string, timeMin: Date, timeMax: Date): Promise<CalendarEvent[]> {
		try {
			const token = await this.auth.getAccessToken();

			const params = new URLSearchParams({
				timeMin: timeMin.toISOString(),
				timeMax: timeMax.toISOString(),
				singleEvents: 'true',
				orderBy: 'startTime',
				maxResults: '2500',
			});

			const response = await requestUrl({
				url: `${this.BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`,
				method: 'GET',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			if (response.status !== 200) {
				this.handleErrorResponse(response);
			}

			const data: GoogleEventsListResponse = response.json;

			return data.items.map(event => this.transformEvent(event, calendarId));
		} catch (error) {
			console.error(`Failed to fetch events for calendar ${calendarId}:`, error);
			throw error;
		}
	}

	/**
	 * Get a specific event
	 */
	async getEvent(calendarId: string, eventId: string): Promise<CalendarEvent> {
		try {
			const token = await this.auth.getAccessToken();

			const response = await requestUrl({
				url: `${this.BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
				method: 'GET',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			if (response.status !== 200) {
				this.handleErrorResponse(response);
			}

			const event = response.json;

			return this.transformEvent(event, calendarId);
		} catch (error) {
			console.error(`Failed to fetch event ${eventId}:`, error);
			throw error;
		}
	}

	/**
	 * Batch fetch events from multiple calendars
	 */
	async listEventsForMultipleCalendars(
		calendarIds: string[],
		timeMin: Date,
		timeMax: Date
	): Promise<Map<string, CalendarEvent[]>> {
		const results = new Map<string, CalendarEvent[]>();

		// Fetch events for all calendars in parallel
		const promises = calendarIds.map(async calendarId => {
			try {
				const events = await this.listEvents(calendarId, timeMin, timeMax);
				results.set(calendarId, events);
			} catch (error) {
				console.error(`Failed to fetch events for calendar ${calendarId}:`, error);
				// Continue with other calendars even if one fails
				results.set(calendarId, []);
			}
		});

		await Promise.all(promises);

		return results;
	}

	/**
	 * Get colors used in Google Calendar
	 */
	async getCalendarColors(): Promise<Record<string, unknown>> {
		try {
			const token = await this.auth.getAccessToken();

			const response = await requestUrl({
				url: `${this.BASE_URL}/colors`,
				method: 'GET',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			if (response.status !== 200) {
				this.handleErrorResponse(response);
			}

			return response.json;
		} catch (error) {
			console.error('Failed to fetch calendar colors:', error);
			throw error;
		}
	}

	/**
	 * Transform Google Calendar API calendar to our format
	 */
	private transformCalendar(calendar: CalendarListEntry): Calendar {
		return {
			id: calendar.id,
			summary: calendar.summary,
			description: calendar.description,
			backgroundColor: calendar.backgroundColor,
			foregroundColor: calendar.foregroundColor,
			selected: !calendar.hidden && !calendar.deleted,
			timeZone: calendar.timeZone,
			accessRole: calendar.accessRole,
			primary: calendar.primary,
		};
	}

	/**
	 * Transform Google Calendar API event to our format
	 */
	private transformEvent(event: GoogleCalendarEvent, calendarId: string): CalendarEvent {
		return {
			id: event.id,
			summary: event.summary || 'Untitled Event',
			description: event.description,
			location: event.location,
			start: {
				dateTime: event.start.dateTime,
				date: event.start.date,
				timeZone: event.start.timeZone,
			},
			end: {
				dateTime: event.end.dateTime,
				date: event.end.date,
				timeZone: event.end.timeZone,
			},
			attendees: event.attendees,
			calendarId: calendarId,
			colorId: event.colorId,
			htmlLink: event.htmlLink,
			recurrence: event.recurrence,
			status: event.status,
			created: event.created,
			updated: event.updated,
			creator: event.creator,
			organizer: event.organizer,
		};
	}

	/**
	 * Handle API error responses
	 */
	private handleErrorResponse(response: { status: number; json: unknown; text: string }): never {
		const statusCode = response.status;
		let errorMessage = `API request failed with status ${statusCode}`;

		try {
			const error = response.json as { error?: { message?: string }; message?: string };
			errorMessage = error.error?.message || error.message || errorMessage;
		} catch {
			// If error parsing fails, use default message
		}

		if (statusCode === 401 || statusCode === 403) {
			throw new AuthenticationError(errorMessage);
		} else if (statusCode >= 500) {
			throw new NetworkError(`Server error: ${errorMessage}`);
		} else {
			throw new APIError(errorMessage, statusCode);
		}
	}

	/**
	 * Test API connection
	 */
	async testConnection(): Promise<boolean> {
		try {
			await this.listCalendars();
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Get user's timezone
	 */
	async getUserTimeZone(): Promise<string> {
		try {
			const token = await this.auth.getAccessToken();

			const response = await requestUrl({
				url: `${this.BASE_URL}/users/me/settings/timezone`,
				method: 'GET',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			if (response.status !== 200) {
				throw new APIError('Failed to fetch timezone');
			}

			const data = response.json;
			return data.value;
		} catch (error) {
			console.error('Failed to fetch timezone:', error);
			// Return browser timezone as fallback
			return Intl.DateTimeFormat().resolvedOptions().timeZone;
		}
	}
}
