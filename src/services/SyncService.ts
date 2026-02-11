import { Notice, Plugin } from 'obsidian';
import { CalendarAPI } from '../api/CalendarAPI';
import {
	CalendarEvent,
	ISyncService,
	PluginSettings,
	SyncState,
	SyncStatus,
} from '../types/calendar';

type PluginWithSettings = Plugin & {
	settings: PluginSettings;
	saveData(data: PluginSettings): Promise<void>;
};

/**
 * Sync Service
 * Orchestrates calendar synchronization with configurable intervals
 */
export class SyncService implements ISyncService {
	private plugin: PluginWithSettings;
	private api: CalendarAPI;
	private syncIntervalId: number | null = null;
	private state: SyncState;
	private events: Map<string, CalendarEvent[]> = new Map();

	constructor(plugin: PluginWithSettings, api: CalendarAPI) {
		this.plugin = plugin;
		this.api = api;
		this.state = {
			status: SyncStatus.Idle,
		};
	}

	/**
	 * Start automatic synchronization
	 */
	startAutoSync(): void {
		this.stopAutoSync(); // Clear any existing interval

		const settings = this.plugin.settings;
		if (!settings.autoSync) {
			return;
		}

		const intervalMs = settings.syncInterval * 60 * 1000;

		// Initial sync
		this.syncNow();

		// Set up interval
		this.syncIntervalId = window.setInterval(() => {
			this.syncNow();
		}, intervalMs);
	}

	/**
	 * Stop automatic synchronization
	 */
	stopAutoSync(): void {
		if (this.syncIntervalId !== null) {
			window.clearInterval(this.syncIntervalId);
			this.syncIntervalId = null;
		}
	}

	/**
	 * Perform immediate synchronization
	 */
	async syncNow(): Promise<void> {
		if (this.state.status === SyncStatus.Syncing) {
			return;
		}

		try {
			this.updateState({
				status: SyncStatus.Syncing,
				error: undefined,
			});

			const settings = this.plugin.settings;

			// Get selected calendars
			const calendars = await this.api.listCalendars();
			const selectedCalendars = calendars.filter(
				cal =>
					settings.selectedCalendars.length === 0 || settings.selectedCalendars.includes(cal.id)
			);

			if (selectedCalendars.length === 0) {
				throw new Error('No calendars selected for sync');
			}

			// Calculate date range
			const now = new Date();
			const timeMin = new Date(now);
			timeMin.setMonth(timeMin.getMonth() - 1); // 1 month in the past

			const timeMax = new Date(now);
			timeMax.setMonth(timeMax.getMonth() + 3); // 3 months in the future

			// Fetch events for all selected calendars
			const eventMap = await this.api.listEventsForMultipleCalendars(
				selectedCalendars.map(cal => cal.id),
				timeMin,
				timeMax
			);

			// Update local cache
			this.events = eventMap;

			// Update settings with last sync time
			settings.lastSyncTime = Date.now();
			await this.plugin.saveData(settings);

			this.updateState({
				status: SyncStatus.Success,
				lastSync: new Date(),
				nextSync: this.calculateNextSync(),
			});

			new Notice(`Calendar sync complete: ${this.getTotalEventCount()} events`);

			// Trigger UI update
			this.plugin.app.workspace.trigger('google-calendar:events-updated', this.getAllEvents());
		} catch (error) {
			console.error('Sync failed:', error);

			this.updateState({
				status: SyncStatus.Error,
				error: error instanceof Error ? error.message : 'Unknown error',
			});

			new Notice(
				'Calendar sync failed: ' + (error instanceof Error ? error.message : 'Unknown error')
			);
		}
	}

	/**
	 * Get current sync status
	 */
	getStatus(): SyncState {
		return { ...this.state };
	}

	/**
	 * Get all cached events
	 */
	getAllEvents(): CalendarEvent[] {
		const allEvents: CalendarEvent[] = [];
		for (const events of this.events.values()) {
			allEvents.push(...events);
		}
		return allEvents;
	}

	/**
	 * Get events for a specific calendar
	 */
	getEventsForCalendar(calendarId: string): CalendarEvent[] {
		return this.events.get(calendarId) || [];
	}

	/**
	 * Get events within a date range
	 */
	getEventsInRange(start: Date, end: Date): CalendarEvent[] {
		const allEvents = this.getAllEvents();

		return allEvents.filter(event => {
			const eventStart = this.getEventStartDate(event);
			const eventEnd = this.getEventEndDate(event);

			// Event overlaps with range if it starts before range end and ends after range start
			return eventStart < end && eventEnd > start;
		});
	}

	/**
	 * Get events for a specific day
	 */
	getEventsForDay(date: Date): CalendarEvent[] {
		const dayStart = new Date(date);
		dayStart.setHours(0, 0, 0, 0);

		const dayEnd = new Date(date);
		dayEnd.setHours(23, 59, 59, 999);

		return this.getEventsInRange(dayStart, dayEnd);
	}

	/**
	 * Clear cached events
	 */
	clearCache(): void {
		this.events.clear();
	}

	/**
	 * Restart auto-sync (useful when settings change)
	 */
	restartAutoSync(): void {
		this.stopAutoSync();
		this.startAutoSync();
	}

	/**
	 * Update sync state and notify listeners
	 */
	private updateState(updates: Partial<SyncState>): void {
		this.state = {
			...this.state,
			...updates,
		};

		// Trigger event for UI updates
		this.plugin.app.workspace.trigger('google-calendar:sync-state-changed', this.state);
	}

	/**
	 * Calculate next sync time
	 */
	private calculateNextSync(): Date {
		const settings = this.plugin.settings;
		const intervalMs = settings.syncInterval * 60 * 1000;
		return new Date(Date.now() + intervalMs);
	}

	/**
	 * Get total event count across all calendars
	 */
	private getTotalEventCount(): number {
		let total = 0;
		for (const events of this.events.values()) {
			total += events.length;
		}
		return total;
	}

	/**
	 * Get event start date
	 */
	private getEventStartDate(event: CalendarEvent): Date {
		if (event.start.dateTime) {
			return new Date(event.start.dateTime);
		} else if (event.start.date) {
			return new Date(event.start.date);
		}
		return new Date();
	}

	/**
	 * Get event end date
	 */
	private getEventEndDate(event: CalendarEvent): Date {
		if (event.end.dateTime) {
			return new Date(event.end.dateTime);
		} else if (event.end.date) {
			return new Date(event.end.date);
		}
		return new Date();
	}

	/**
	 * Cleanup on plugin unload
	 */
	destroy(): void {
		this.stopAutoSync();
		this.clearCache();
	}
}
