/**
 * SyncService Tests
 */

import {
	createMockAPI,
	createMockCalendar,
	createMockEvent,
	createMockPlugin,
} from '../../__mocks__/factories';
import { CalendarAPI } from '../../api/CalendarAPI';
import { SyncStatus } from '../../types/calendar';
import { SyncService } from '../SyncService';

// Mock Obsidian
jest.mock('obsidian');

describe('SyncService', () => {
	let syncService: SyncService;
	let mockPlugin: any;
	let mockAPI: jest.Mocked<CalendarAPI>;

	beforeEach(() => {
		mockPlugin = createMockPlugin();
		mockAPI = createMockAPI() as any;
		syncService = new SyncService(mockPlugin, mockAPI as any);
		jest.clearAllMocks();
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	describe('startAutoSync', () => {
		it('should start periodic sync', () => {
			// Arrange
			mockPlugin.settings.autoSync = true;
			mockPlugin.settings.syncInterval = 15;

			// Act
			syncService.startAutoSync();

			// Assert
			expect(mockAPI.listCalendars).toHaveBeenCalled();
		});

		it('should not start if autoSync is disabled', () => {
			// Arrange
			mockPlugin.settings.autoSync = false;

			// Act
			syncService.startAutoSync();

			// Assert
			expect(mockAPI.listCalendars).not.toHaveBeenCalled();
		});

		it('should stop existing interval before starting new one', () => {
			// Arrange
			mockPlugin.settings.autoSync = true;
			const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

			// Act
			syncService.startAutoSync();
			syncService.startAutoSync();

			// Assert
			expect(clearIntervalSpy).toHaveBeenCalled();
		});
	});

	describe('stopAutoSync', () => {
		it('should clear sync interval', () => {
			// Arrange
			mockPlugin.settings.autoSync = true;
			const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
			syncService.startAutoSync();

			// Act
			syncService.stopAutoSync();

			// Assert
			expect(clearIntervalSpy).toHaveBeenCalled();
		});
	});

	describe('syncNow', () => {
		it('should fetch events from all calendars', async () => {
			// Arrange
			const calendar1 = createMockCalendar({ id: 'cal1' });
			const calendar2 = createMockCalendar({ id: 'cal2' });
			mockAPI.listCalendars.mockResolvedValue([calendar1, calendar2]);

			const event1 = createMockEvent({ id: 'event1' });
			const event2 = createMockEvent({ id: 'event2' });
			mockAPI.listEventsForMultipleCalendars.mockResolvedValue(
				new Map([
					['cal1', [event1]],
					['cal2', [event2]],
				])
			);

			// Act
			await syncService.syncNow();

			// Assert
			expect(mockAPI.listCalendars).toHaveBeenCalled();
			expect(mockAPI.listEventsForMultipleCalendars).toHaveBeenCalledWith(
				['cal1', 'cal2'],
				expect.any(Date),
				expect.any(Date)
			);
		});

		it('should update sync status to syncing', async () => {
			// Arrange
			mockAPI.listCalendars.mockResolvedValue([]);

			// Act
			const syncPromise = syncService.syncNow();
			const statusDuringSync = syncService.getStatus();
			await syncPromise;

			// Assert
			expect(statusDuringSync.status).toBe(SyncStatus.Syncing);
		});

		it('should update sync status to success after completion', async () => {
			// Arrange
			mockAPI.listCalendars.mockResolvedValue([createMockCalendar()]);
			mockAPI.listEventsForMultipleCalendars.mockResolvedValue(new Map());

			// Act
			await syncService.syncNow();
			const status = syncService.getStatus();

			// Assert
			expect(status.status).toBe(SyncStatus.Success);
			expect(status.lastSync).toBeInstanceOf(Date);
		});

		it('should handle sync errors', async () => {
			// Arrange
			mockAPI.listCalendars.mockRejectedValue(new Error('Network error'));

			// Act
			await syncService.syncNow();
			const status = syncService.getStatus();

			// Assert
			expect(status.status).toBe(SyncStatus.Error);
			expect(status.error).toBe('Network error');
		});

		it('should not sync if already syncing', async () => {
			// Arrange
		let callCount = 0;
		mockAPI.listCalendars.mockResolvedValue([createMockCalendar()]);
		mockAPI.listEventsForMultipleCalendars.mockImplementation(async () => {
			callCount++;
			if (callCount === 1) {
				await new Promise(resolve => setTimeout(resolve, 100));
			}
			return new Map();
		});

		// Act
		const sync1 = syncService.syncNow();
		const sync2 = syncService.syncNow(); // Should be blocked

		await Promise.all([sync1, sync2]);

		// Assert - second call should be blocked
		expect(callCount).toBe(1);
	});

it('should filter calendars by selected calendars setting', async () => {
	// Arrange
	mockPlugin.settings.selectedCalendars = ['cal1'];
	const calendar1 = createMockCalendar({ id: 'cal1' });
	const calendar2 = createMockCalendar({ id: 'cal2' });
	mockAPI.listCalendars.mockResolvedValue([calendar1, calendar2]);
	mockAPI.listEventsForMultipleCalendars.mockResolvedValue(new Map());

	// Act
	await syncService.syncNow();

	// Assert
	expect(mockAPI.listEventsForMultipleCalendars).toHaveBeenCalledWith(
		['cal1'],
		expect.any(Date),
		expect.any(Date)
	);
});
			const calendar = createMockCalendar();
			mockAPI.listCalendars.mockResolvedValue([calendar]);
			mockAPI.listEventsForMultipleCalendars.mockResolvedValue(new Map());

			// Create fresh mock for saveData
			const saveDataSpy = jest.fn().mockResolvedValue(undefined);
			mockPlugin.saveData = saveDataSpy;

			const beforeTime = Date.now();

			// Act
			await syncService.syncNow();

			// Assert
			expect(saveDataSpy).toHaveBeenCalled();
			const savedData = saveDataSpy.mock.calls[0][0];
			expect(savedData.lastSyncTime).toBeGreaterThanOrEqual(beforeTime);
		});
	});

	describe('getAllEvents', () => {
		it('should return all cached events', async () => {
			// Arrange
			const event1 = createMockEvent({ id: 'event1' });
			const event2 = createMockEvent({ id: 'event2' });
			mockAPI.listCalendars.mockResolvedValue([createMockCalendar()]);
			mockAPI.listEventsForMultipleCalendars.mockResolvedValue(
				new Map([['primary', [event1, event2]]])
			);
			await syncService.syncNow();

			// Act
			const events = syncService.getAllEvents();

			// Assert
			expect(events).toHaveLength(2);
			expect(events).toContainEqual(expect.objectContaining({ id: 'event1' }));
			expect(events).toContainEqual(expect.objectContaining({ id: 'event2' }));
		});

		it('should return empty array if no events cached', () => {
			// Act
			const events = syncService.getAllEvents();

			// Assert
			expect(events).toEqual([]);
		});
	});

	describe('getEventsForCalendar', () => {
		it('should return events for specific calendar', async () => {
			// Arrange
			const event1 = createMockEvent({ id: 'event1', calendarId: 'cal1' });
			const event2 = createMockEvent({ id: 'event2', calendarId: 'cal2' });
			mockAPI.listCalendars.mockResolvedValue([
				createMockCalendar({ id: 'cal1' }),
				createMockCalendar({ id: 'cal2' }),
			]);
			mockAPI.listEventsForMultipleCalendars.mockResolvedValue(
				new Map([
					['cal1', [event1]],
					['cal2', [event2]],
				])
			);
			await syncService.syncNow();

			// Act
			const events = syncService.getEventsForCalendar('cal1');

			// Assert
			expect(events).toHaveLength(1);
			expect(events[0].id).toBe('event1');
		});

		it('should return empty array for non-existent calendar', () => {
			// Act
			const events = syncService.getEventsForCalendar('nonexistent');

			// Assert
			expect(events).toEqual([]);
		});
	});

	describe('getEventsInRange', () => {
		it('should return events within date range', async () => {
			// Arrange
			const event1 = createMockEvent({
				id: 'event1',
				start: { dateTime: '2024-01-15T10:00:00Z' },
				end: { dateTime: '2024-01-15T11:00:00Z' },
			});
			const event2 = createMockEvent({
				id: 'event2',
				start: { dateTime: '2024-01-20T10:00:00Z' },
				end: { dateTime: '2024-01-20T11:00:00Z' },
			});
			mockAPI.listCalendars.mockResolvedValue([createMockCalendar()]);
			mockAPI.listEventsForMultipleCalendars.mockResolvedValue(
				new Map([['primary', [event1, event2]]])
			);
			await syncService.syncNow();

			// Act
			const events = syncService.getEventsInRange(
				new Date('2024-01-15T00:00:00Z'),
				new Date('2024-01-16T00:00:00Z')
			);

			// Assert
			expect(events).toHaveLength(1);
			expect(events[0].id).toBe('event1');
		});
	});

	describe('getEventsForDay', () => {
		it('should return events for specific day', async () => {
			// Arrange
			const event = createMockEvent({
				start: { dateTime: '2024-01-15T10:00:00Z' },
				end: { dateTime: '2024-01-15T11:00:00Z' },
			});
			mockAPI.listCalendars.mockResolvedValue([createMockCalendar()]);
			mockAPI.listEventsForMultipleCalendars.mockResolvedValue(new Map([['primary', [event]]]));
			await syncService.syncNow();

			// Act
			const events = syncService.getEventsForDay(new Date('2024-01-15'));

			// Assert
			expect(events).toHaveLength(1);
		});
	});

	describe('clearCache', () => {
		it('should clear all cached events', async () => {
			// Arrange
			mockAPI.listCalendars.mockResolvedValue([createMockCalendar()]);
			mockAPI.listEventsForMultipleCalendars.mockResolvedValue(
				new Map([['primary', [createMockEvent()]]])
			);
			await syncService.syncNow();

			// Act
			syncService.clearCache();
			const events = syncService.getAllEvents();

			// Assert
			expect(events).toEqual([]);
		});
	});

	describe('restartAutoSync', () => {
		it('should stop and start auto sync', () => {
			// Arrange
			const stopSpy = jest.spyOn(syncService, 'stopAutoSync');
			const startSpy = jest.spyOn(syncService, 'startAutoSync');

			// Act
			syncService.restartAutoSync();

			// Assert
			expect(stopSpy).toHaveBeenCalled();
			expect(startSpy).toHaveBeenCalled();
		});
	});
});
