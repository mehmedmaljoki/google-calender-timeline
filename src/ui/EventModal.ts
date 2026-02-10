import { App, Modal } from 'obsidian';
import GoogleCalendarTimelinePlugin from '../main';
import { CalendarEvent } from '../types/calendar';

/**
 * Event Details Modal
 * Shows event information and allows note creation
 */
export class EventModal extends Modal {
	private event: CalendarEvent;
	private plugin: GoogleCalendarTimelinePlugin;

	constructor(app: App, event: CalendarEvent, plugin: GoogleCalendarTimelinePlugin) {
		super(app);
		this.event = event;
		this.plugin = plugin;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('calendar-event-modal');

		// Title
		contentEl.createEl('h2', { text: this.event.summary });

		// Event details
		const detailsContainer = contentEl.createDiv('event-details');

		// Date and time
		this.addDetail(detailsContainer, '📅 When', this.formatDateTime());

		// Location
		if (this.event.location) {
			this.addDetail(detailsContainer, '📍 Where', this.event.location);
		}

		// Description
		if (this.event.description) {
			this.addDetail(detailsContainer, '📝 Description', this.event.description);
		}

		// Attendees
		if (this.event.attendees && this.event.attendees.length > 0) {
			const attendees = this.event.attendees.map(a => a.displayName || a.email).join(', ');
			this.addDetail(detailsContainer, '👥 Attendees', attendees);
		}

		// Actions
		const actions = contentEl.createDiv('event-actions');

		// Create note button
		const createNoteBtn = actions.createEl('button', {
			text: 'Create Note',
			cls: 'mod-cta',
		});
		createNoteBtn.addEventListener('click', async () => {
			await this.plugin.noteCreator.createNote(this.event);
			this.close();
		});

		// Open in Google Calendar button
		const openBtn = actions.createEl('button', { text: 'Open in Google Calendar' });
		openBtn.addEventListener('click', () => {
			window.open(this.event.htmlLink, '_blank');
		});

		// Close button
		const closeBtn = actions.createEl('button', { text: 'Close' });
		closeBtn.addEventListener('click', () => this.close());
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}

	private addDetail(container: HTMLElement, label: string, value: string): void {
		const detail = container.createDiv('event-detail');
		detail.createEl('strong', { text: label });
		detail.createEl('p', { text: value });
	}

	private formatDateTime(): string {
		if (this.event.start.dateTime && this.event.end.dateTime) {
			const start = new Date(this.event.start.dateTime);
			const end = new Date(this.event.end.dateTime);

			const dateStr = start.toLocaleDateString('en-US', {
				weekday: 'long',
				year: 'numeric',
				month: 'long',
				day: 'numeric',
			});

			const startTime = start.toLocaleTimeString('en-US', {
				hour: 'numeric',
				minute: '2-digit',
			});

			const endTime = end.toLocaleTimeString('en-US', {
				hour: 'numeric',
				minute: '2-digit',
			});

			return `${dateStr}\n${startTime} - ${endTime}`;
		} else {
			const date = new Date(this.event.start.date || this.event.start.dateTime || '');
			return (
				date.toLocaleDateString('en-US', {
					weekday: 'long',
					year: 'numeric',
					month: 'long',
					day: 'numeric',
				}) + '\nAll day'
			);
		}
	}
}
