/**
 * CalendarAPI Tests
 */

import { createMockAuth, createMockEvent } from '../../__mocks__/factories';
import { GoogleAuth } from '../../auth/GoogleAuth';
import { APIError, AuthenticationError, NetworkError } from '../../types/calendar';
import { CalendarAPI } from '../CalendarAPI';

// Mock Obsidian
jest.mock('obsidian');

// Mock fetch
global.fetch = jest.fn();

describe('CalendarAPI', () => {
	let api: CalendarAPI;
	let mockAuth: jest.Mocked<GoogleAuth>;

	beforeEach(() => {
		mockAuth = createMockAuth() as any;
		api = new CalendarAPI(mockAuth as any);
		jest.clearAllMocks();
	});

	describe('listCalendars', () => {
		it('should fetch and transform calendars', async () => {
			// Arrange
			const mockCalendarData = {
				items: [
					{
						id: 'primary',
						summary: 'My Calendar',
						backgroundColor: '#9E69AF',
						foregroundColor: '#FFFFFF',
						timeZone: 'America/New_York',
					},
				],
			};

			(global.fetch as jest.Mock).mockResolvedValue({
				ok: true,
				json: async () => mockCalendarData,
			});

			// Act
			const calendars = await api.listCalendars();

			// Assert
			expect(calendars).toHaveLength(1);
			expect(calendars[0]).toEqual(
				expect.objectContaining({
					id: 'primary',
					summary: 'My Calendar',
					backgroundColor: '#9E69AF',
				})
			);
			expect(mockAuth.getAccessToken).toHaveBeenCalled();
		});

		it('should handle authentication errors', async () => {
			// Arrange
			(global.fetch as jest.Mock).mockResolvedValue({
				ok: false,
				status: 401,
				json: async () => ({ error: { message: 'Unauthorized' } }),
			});

			// Act & Assert
			await expect(api.listCalendars()).rejects.toThrow(AuthenticationError);
		});

		it('should handle network errors', async () => {
			// Arrange
			(global.fetch as jest.Mock).mockResolvedValue({
				ok: false,
				status: 503,
				json: async () => ({ error: { message: 'Service unavailable' } }),
			});

			// Act & Assert
			await expect(api.listCalendars()).rejects.toThrow(NetworkError);
		});
	});

	describe('listEvents', () => {
		it('should fetch events for a calendar', async () => {
			// Arrange
			const mockEventsData = {
				items: [
					{
						id: 'event1',
						summary: 'Team Meeting',
						start: { dateTime: '2024-01-15T10:00:00Z' },
						end: { dateTime: '2024-01-15T11:00:00Z' },
						htmlLink: 'https://calendar.google.com/event?eid=123',
					},
				],
			};

			(global.fetch as jest.Mock).mockResolvedValue({
				ok: true,
				json: async () => mockEventsData,
			});

			const timeMin = new Date('2024-01-01');
			const timeMax = new Date('2024-01-31');

			// Act
			const events = await api.listEvents('primary', timeMin, timeMax);

			// Assert
			expect(events).toHaveLength(1);
			expect(events[0]).toEqual(
				expect.objectContaining({
					id: 'event1',
					summary: 'Team Meeting',
					calendarId: 'primary',
				})
			);
		});

		it('should include query parameters in request', async () => {
			// Arrange
			(global.fetch as jest.Mock).mockResolvedValue({
				ok: true,
				json: async () => ({ items: [] }),
			});

			const timeMin = new Date('2024-01-01T00:00:00Z');
			const timeMax = new Date('2024-01-31T23:59:59Z');

			// Act
			await api.listEvents('primary', timeMin, timeMax);

			// Assert
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('timeMin='),
				expect.any(Object)
			);
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('timeMax='),
				expect.any(Object)
			);
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('singleEvents=true'),
				expect.any(Object)
			);
		});

		it('should handle empty results', async () => {
			// Arrange
			(global.fetch as jest.Mock).mockResolvedValue({
				ok: true,
				json: async () => ({ items: [] }),
			});

			// Act
			const events = await api.listEvents('primary', new Date(), new Date());

			// Assert
			expect(events).toEqual([]);
		});
	});

	describe('getEvent', () => {
		it('should fetch a specific event', async () => {
			// Arrange
			const mockEventData = {
				id: 'event123',
				summary: 'Important Meeting',
				start: { dateTime: '2024-01-15T10:00:00Z' },
				end: { dateTime: '2024-01-15T11:00:00Z' },
				htmlLink: 'https://calendar.google.com/event?eid=123',
			};

			(global.fetch as jest.Mock).mockResolvedValue({
				ok: true,
				json: async () => mockEventData,
			});

			// Act
			const event = await api.getEvent('primary', 'event123');

			// Assert
			expect(event).toEqual(
				expect.objectContaining({
					id: 'event123',
					summary: 'Important Meeting',
				})
			);
		});

		it('should handle not found errors', async () => {
			// Arrange
			(global.fetch as jest.Mock).mockResolvedValue({
				ok: false,
				status: 404,
				json: async () => ({ error: { message: 'Not found' } }),
			});

			// Act & Assert
			await expect(api.getEvent('primary', 'nonexistent')).rejects.toThrow(APIError);
		});
	});

	describe('listEventsForMultipleCalendars', () => {
		it('should fetch events from multiple calendars', async () => {
			// Arrange
			const calendar1Events = {
				items: [createMockEvent({ id: 'event1', calendarId: 'cal1' })],
			};
			const calendar2Events = {
				items: [createMockEvent({ id: 'event2', calendarId: 'cal2' })],
			};

			(global.fetch as jest.Mock)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => calendar1Events,
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => calendar2Events,
				});

			// Act
			const eventMap = await api.listEventsForMultipleCalendars(
				['cal1', 'cal2'],
				new Date(),
				new Date()
			);

			// Assert
			expect(eventMap.size).toBe(2);
			expect(eventMap.get('cal1')).toHaveLength(1);
			expect(eventMap.get('cal2')).toHaveLength(1);
		});

		it('should continue on individual calendar failures', async () => {
			// Arrange
			const successEvents = {
				items: [createMockEvent()],
			};

			(global.fetch as jest.Mock)
				.mockResolvedValueOnce({
					ok: false,
					status: 403,
					json: async () => ({ error: { message: 'Forbidden' } }),
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => successEvents,
				});

			// Act
			const eventMap = await api.listEventsForMultipleCalendars(
				['forbidden-cal', 'valid-cal'],
				new Date(),
				new Date()
			);

			// Assert
			expect(eventMap.size).toBe(2);
			expect(eventMap.get('forbidden-cal')).toEqual([]);
			expect(eventMap.get('valid-cal')).toHaveLength(1);
		});
	});

	describe('testConnection', () => {
		it('should return true on successful connection', async () => {
			// Arrange
			(global.fetch as jest.Mock).mockResolvedValue({
				ok: true,
				json: async () => ({ items: [] }),
			});

			// Act
			const isConnected = await api.testConnection();

			// Assert
			expect(isConnected).toBe(true);
		});

		it('should return false on connection failure', async () => {
			// Arrange
			(global.fetch as jest.Mock).mockResolvedValue({
				ok: false,
				status: 401,
				json: async () => ({ error: { message: 'Unauthorized' } }),
			});

			// Act
			const isConnected = await api.testConnection();

			// Assert
			expect(isConnected).toBe(false);
		});
	});

	describe('getUserTimeZone', () => {
		it('should fetch user timezone', async () => {
			// Arrange
			(global.fetch as jest.Mock).mockResolvedValue({
				ok: true,
				json: async () => ({ value: 'America/New_York' }),
			});

			// Act
			const timezone = await api.getUserTimeZone();

			// Assert
			expect(timezone).toBe('America/New_York');
		});

		it('should fallback to browser timezone on error', async () => {
			// Arrange
			(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

			// Act
			const timezone = await api.getUserTimeZone();

			// Assert
			expect(timezone).toBeDefined();
			expect(typeof timezone).toBe('string');
		});
	});

	describe('error handling', () => {
		it('should throw AuthenticationError for 401 status', async () => {
			// Arrange
			(global.fetch as jest.Mock).mockResolvedValue({
				ok: false,
				status: 401,
				json: async () => ({ error: { message: 'Unauthorized' } }),
			});

			// Act & Assert
			await expect(api.listCalendars()).rejects.toThrow(AuthenticationError);
		});

		it('should throw NetworkError for 5xx status', async () => {
			// Arrange
			(global.fetch as jest.Mock).mockResolvedValue({
				ok: false,
				status: 500,
				json: async () => ({ error: { message: 'Internal server error' } }),
			});

			// Act & Assert
			await expect(api.listCalendars()).rejects.toThrow(NetworkError);
		});

		it('should throw APIError for other status codes', async () => {
			// Arrange
			(global.fetch as jest.Mock).mockResolvedValue({
				ok: false,
				status: 400,
				json: async () => ({ error: { message: 'Bad request' } }),
			});

			// Act & Assert
			await expect(api.listCalendars()).rejects.toThrow(APIError);
		});
	});
});
