import { ItemView, WorkspaceLeaf } from 'obsidian';
import { DataSet, Timeline } from 'vis-timeline/standalone';
import GoogleCalendarTimelinePlugin from '../main';
import { Calendar, CalendarEvent, TimelineItem } from '../types/calendar';
import { EventModal } from './EventModal';

type TimelineItemWithEvent = TimelineItem & { event: CalendarEvent };

export const VIEW_TYPE_TIMELINE = 'google-calendar-timeline';

/**
 * Timeline View
 * Displays calendar events in an interactive timeline
 */
export class TimelineView extends ItemView {
	private plugin: GoogleCalendarTimelinePlugin;
	private timeline: Timeline | null = null;
	private container!: HTMLElement;
	private currentDate: Date = new Date();

	constructor(leaf: WorkspaceLeaf, plugin: GoogleCalendarTimelinePlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return VIEW_TYPE_TIMELINE;
	}

	getDisplayText(): string {
		return 'Calendar timeline';
	}

	getIcon(): string {
		return 'calendar';
	}

	onOpen(): Promise<void> {
		this.container = this.contentEl;
		this.container.empty();
		this.container.addClass('google-calendar-timeline-view');

		// Create header
		this.createHeader();

		// Create timeline container
		const timelineContainer = this.container.createDiv('timeline-container');

		// Initialize timeline
		this.initializeTimeline(timelineContainer);

		// Auto-refresh will be handled by plugin commands

		// Initial load
		this.refreshTimeline();

		return Promise.resolve();
	}

	onClose(): Promise<void> {
		if (this.timeline) {
			this.timeline.destroy();
			this.timeline = null;
		}
		return Promise.resolve();
	}

	/**
	 * Create header with controls
	 */
	private createHeader(): void {
		const header = this.container.createDiv('timeline-header');

		// Title
		header.createEl('h4', { text: 'Calendar timeline' });

		// Controls
		const controls = header.createDiv('timeline-controls');

		// Today button
		const todayBtn = controls.createEl('button', { text: 'Today' });
		todayBtn.addEventListener('click', () => this.goToToday());

		// Previous day button
		const prevBtn = controls.createEl('button', { text: '←' });
		prevBtn.addEventListener('click', () => this.navigateDay(-1));

		// Next day button
		const nextBtn = controls.createEl('button', { text: '→' });
		nextBtn.addEventListener('click', () => this.navigateDay(1));

		// Date display
		const dateDisplay = controls.createEl('span', { cls: 'current-date' });
		this.updateDateDisplay(dateDisplay);

		// Refresh button
		const refreshBtn = controls.createEl('button', { text: '⟳' });
		refreshBtn.addEventListener('click', () => this.refreshTimeline());
	}

	/**
	 * Initialize vis-timeline
	 */
	private initializeTimeline(container: HTMLElement): void {
		const options = {
			height: '600px',
			minHeight: '300px',
			maxHeight: '800px',
			orientation: 'top',
			showCurrentTime: true,
			zoomable: true,
			moveable: true,
			start: this.getStartOfDay(this.currentDate),
			end: this.getEndOfDay(this.currentDate),
			min: new Date(2020, 0, 1),
			max: new Date(2030, 11, 31),
			locale: 'en',
			stack: false,
			editable: false,
			selectable: true,
		};

		const items = new DataSet([]);
		this.timeline = new Timeline(container, items, options);

		// Handle item selection
		this.timeline.on('select', properties => {
			if (properties.items.length > 0) {
				const eventId = properties.items[0];
				void this.handleEventClick(eventId);
			}
		});

		// Handle double click
		this.timeline.on('doubleClick', properties => {
			if (properties.item) {
				void this.handleEventDoubleClick(properties.item);
			}
		});
	}

	/**
	 * Refresh timeline with current events
	 */
	private refreshTimeline(): void {
		if (!this.timeline) {
			return;
		}

		const syncService = this.plugin.syncService;
		const events = syncService.getEventsForDay(this.currentDate);

		const items = events.map(event => this.convertEventToTimelineItem(event));

		// Update timeline data
		const dataset = (this.timeline as unknown as { itemsData: DataSet<TimelineItemWithEvent> })
			.itemsData;
		dataset.clear();
		dataset.add(items);

		// Fit timeline to events
		if (items.length > 0) {
			this.timeline.fit();
		}
	}

	/**
	 * Convert calendar event to timeline item
	 */
	private convertEventToTimelineItem(event: CalendarEvent): TimelineItemWithEvent {
		const start = event.start.dateTime
			? new Date(event.start.dateTime)
			: new Date(event.start.date || '');

		const end = event.end.dateTime ? new Date(event.end.dateTime) : new Date(event.end.date || '');

		// Get calendar for color
		const calendar = this.getCalendarById(event.calendarId);
		const color = calendar?.backgroundColor || '#3788d8';

		return {
			id: event.id,
			content: event.summary,
			start: start,
			end: end,
			title: this.createEventTooltip(event),
			className: 'calendar-event',
			style: `background-color: ${color}; border-color: ${color};`,
			event: event, // Store full event for later use
		};
	}

	/**
	 * Create tooltip for event
	 */
	private createEventTooltip(event: CalendarEvent): string {
		let tooltip = event.summary;

		if (event.location) {
			tooltip += `\n📍 ${event.location}`;
		}

		if (event.description) {
			tooltip += `\n\n${event.description}`;
		}

		return tooltip;
	}

	/**
	 * Handle event click
	 */
	private handleEventClick(eventId: string): void {
		const syncService = this.plugin.syncService;
		const allEvents = syncService.getAllEvents();
		const event = allEvents.find(e => e.id === eventId);

		if (event) {
			// Open event modal
			new EventModal(this.app, event, this.plugin).open();
		}
	}

	/**
	 * Handle event double click (create note)
	 */
	private async handleEventDoubleClick(eventId: string): Promise<void> {
		const syncService = this.plugin.syncService;
		const allEvents = syncService.getAllEvents();
		const event = allEvents.find(e => e.id === eventId);

		if (event) {
			await this.plugin.noteCreator.createNote(event);
		}
	}

	/**
	 * Navigate to today
	 */
	private goToToday(): void {
		this.currentDate = new Date();
		this.updateTimeline();
	}

	/**
	 * Navigate days
	 */
	private navigateDay(delta: number): void {
		this.currentDate.setDate(this.currentDate.getDate() + delta);
		this.updateTimeline();
	}

	/**
	 * Update timeline view
	 */
	private updateTimeline(): void {
		if (!this.timeline) {
			return;
		}

		this.timeline.setWindow(
			this.getStartOfDay(this.currentDate),
			this.getEndOfDay(this.currentDate)
		);

		this.refreshTimeline();
		this.updateDateDisplay();
	}

	/**
	 * Update date display
	 */
	private updateDateDisplay(element?: HTMLElement): void {
		const dateStr = this.currentDate.toLocaleDateString('en-US', {
			weekday: 'short',
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});

		if (element) {
			element.textContent = dateStr;
		} else {
			const dateEl = this.container.querySelector('.current-date');
			if (dateEl) {
				dateEl.textContent = dateStr;
			}
		}
	}

	/**
	 * Get start of day
	 */
	private getStartOfDay(date: Date): Date {
		const start = new Date(date);
		start.setHours(this.plugin.settings.startHour, 0, 0, 0);
		return start;
	}

	/**
	 * Get end of day
	 */
	private getEndOfDay(date: Date): Date {
		const end = new Date(date);
		end.setHours(this.plugin.settings.endHour, 59, 59, 999);
		return end;
	}

	/**
	 * Get calendar by ID
	 */
	private getCalendarById(_calendarId: string): Calendar | undefined {
		// This would need to be implemented to fetch from calendar list
		return undefined;
	}
}
