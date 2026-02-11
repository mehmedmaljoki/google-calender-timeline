import { App, Notice, TFile } from 'obsidian';
import { CalendarEvent, EventDateTime, INoteCreator, PluginSettings } from '../types/calendar';

/**
 * Note Creator Service
 * Generates markdown notes from calendar events
 */
export class NoteCreator implements INoteCreator {
	private app: App;
	private settings: PluginSettings;

	constructor(app: App, settings: PluginSettings) {
		this.app = app;
		this.settings = settings;
	}

	/**
	 * Create a note from a calendar event
	 */
	async createNote(event: CalendarEvent): Promise<TFile> {
		try {
			const filename = this.generateFilename(event);
			const content = this.generateContent(event);

			// Check if file already exists
			const existingFile = this.app.vault.getAbstractFileByPath(filename);
			if (existingFile instanceof TFile) {
				const overwrite = this.confirmOverwrite(filename);
				if (!overwrite) {
					return existingFile;
				}
				// Delete existing file
				await this.app.fileManager.trashFile(existingFile);
			}

			// Create the note
			const file = await this.app.vault.create(filename, content);

			// Open the note if configured
			if (this.settings.openNoteAfterCreation) {
				const leaf = this.app.workspace.getLeaf(false);
				await leaf.openFile(file);
			}

			new Notice(`Note created: ${file.name}`);
			return file;
		} catch (error) {
			console.error('Failed to create note:', error);
			new Notice(
				'Failed to create note: ' + (error instanceof Error ? error.message : 'Unknown error')
			);
			throw error;
		}
	}

	/**
	 * Generate note content from event using template
	 */
	generateContent(event: CalendarEvent): string {
		let content = this.settings.noteTemplate;

		// Replace template variables
		content = content.replace(/\{\{title\}\}/g, this.escapeMarkdown(event.summary));
		content = content.replace(/\{\{date\}\}/g, this.formatDate(event.start));
		content = content.replace(/\{\{time\}\}/g, this.formatTime(event.start, event.end));
		content = content.replace(
			/\{\{description\}\}/g,
			this.escapeMarkdown(event.description || 'No description')
		);
		content = content.replace(
			/\{\{location\}\}/g,
			this.escapeMarkdown(event.location || 'No location')
		);
		content = content.replace(/\{\{attendees\}\}/g, this.formatAttendees(event));
		content = content.replace(/\{\{calendar\}\}/g, event.calendarId);
		content = content.replace(/\{\{link\}\}/g, event.htmlLink);

		return content;
	}

	/**
	 * Generate filename for the note
	 */
	generateFilename(event: CalendarEvent): string {
		let filename: string;

		switch (this.settings.fileNamingStrategy) {
			case 'title':
				filename = this.sanitizeFilename(event.summary);
				break;

			case 'date-title': {
				const dateStr = this.formatDateForFilename(event.start);
				filename = `${dateStr} - ${this.sanitizeFilename(event.summary)}`;
				break;
			}

			case 'custom':
				if (this.settings.customFileNameTemplate) {
					filename = this.applyCustomTemplate(event, this.settings.customFileNameTemplate);
				} else {
					filename = this.sanitizeFilename(event.summary);
				}
				break;

			default:
				filename = this.sanitizeFilename(event.summary);
		}

		// Add .md extension
		if (!filename.endsWith('.md')) {
			filename += '.md';
		}

		// Add path if specified
		const location = this.settings.noteLocation;
		if (location) {
			filename = `${location}/${filename}`;
		}

		return filename;
	}

	/**
	 * Apply custom filename template
	 */
	private applyCustomTemplate(event: CalendarEvent, template: string): string {
		let filename = template;

		filename = filename.replace(/\{\{title\}\}/g, this.sanitizeFilename(event.summary));
		filename = filename.replace(/\{\{date\}\}/g, this.formatDateForFilename(event.start));
		filename = filename.replace(/\{\{time\}\}/g, this.formatTimeForFilename(event.start));
		filename = filename.replace(/\{\{calendar\}\}/g, this.sanitizeFilename(event.calendarId));
		filename = filename.replace(/\{\{id\}\}/g, event.id);

		return this.sanitizeFilename(filename);
	}

	/**
	 * Sanitize filename to remove invalid characters
	 */
	private sanitizeFilename(input: string): string {
		return input
			.replace(/[<>:"/\\|?*]/g, '-') // Replace invalid chars with dash
			.replace(/\s+/g, ' ') // Normalize whitespace
			.replace(/^\.+/, '') // Remove leading dots
			.trim()
			.substring(0, 200); // Limit length
	}

	/**
	 * Escape markdown special characters
	 */
	private escapeMarkdown(text: string): string {
		return text.replace(/([\\`*_{}[\]()#+\-.!|])/g, '\\$1');
	}

	/**
	 * Format date for display
	 */
	private formatDate(eventDateTime: EventDateTime): string {
		const dateValue = eventDateTime.dateTime ?? eventDateTime.date ?? '';
		const date = new Date(dateValue);

		return date.toLocaleDateString('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	}

	/**
	 * Format time range for display
	 */
	private formatTime(start: EventDateTime, end: EventDateTime): string {
		if (!start.dateTime || !end.dateTime) {
			return 'All day';
		}

		const startDate = new Date(start.dateTime);
		const endDate = new Date(end.dateTime);

		const startTime = startDate.toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true,
		});

		const endTime = endDate.toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true,
		});

		return `${startTime} - ${endTime}`;
	}

	/**
	 * Format date for filename
	 */
	private formatDateForFilename(eventDateTime: EventDateTime): string {
		const dateValue = eventDateTime.dateTime ?? eventDateTime.date ?? '';
		const date = new Date(dateValue);

		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');

		return `${year}-${month}-${day}`;
	}

	/**
	 * Format time for filename
	 */
	private formatTimeForFilename(eventDateTime: EventDateTime): string {
		if (!eventDateTime.dateTime) {
			return 'allday';
		}

		const date = new Date(eventDateTime.dateTime);
		const hours = String(date.getHours()).padStart(2, '0');
		const minutes = String(date.getMinutes()).padStart(2, '0');

		return `${hours}${minutes}`;
	}

	/**
	 * Format attendees list
	 */
	private formatAttendees(event: CalendarEvent): string {
		if (!event.attendees || event.attendees.length === 0) {
			return 'No attendees';
		}

		return event.attendees
			.map(attendee => {
				const name = attendee.displayName || attendee.email;
				const status = attendee.responseStatus ? ` (${attendee.responseStatus})` : '';
				return `- ${name}${status}`;
			})
			.join('\n');
	}

	/**
	 * Confirm file overwrite with user
	 */
	private confirmOverwrite(filename: string): boolean {
		const appWithActiveLeaf = this.app as unknown as {
			workspace: { activeLeaf?: { view?: { containerEl?: HTMLElement } } };
		};
		const defaultView =
			appWithActiveLeaf.workspace.activeLeaf?.view?.containerEl?.ownerDocument?.defaultView;
		const confirmFn = (defaultView?.confirm || window.confirm).bind(defaultView || window);
		return confirmFn(`File "${filename}" already exists. Overwrite?`);
	}

	/**
	 * Batch create notes from multiple events
	 */
	async createNotesFromEvents(events: CalendarEvent[]): Promise<TFile[]> {
		const files: TFile[] = [];

		for (const event of events) {
			try {
				const file = await this.createNote(event);
				files.push(file);
			} catch (error) {
				console.error(`Failed to create note for event ${event.id}:`, error);
				// Continue with other events
			}
		}

		new Notice(`Created ${files.length} notes from ${events.length} events`);
		return files;
	}
}
