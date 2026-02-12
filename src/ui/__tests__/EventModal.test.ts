import { App, PluginManifest } from 'obsidian';
import { createMockEvent, createMockSettings } from '../../__mocks__/factories';
import GoogleCalendarTimelinePlugin from '../../main';
import { EventModal } from '../EventModal';

jest.mock('obsidian');
jest.mock('vis-timeline/standalone', () => ({
	DataSet: class {},
	Timeline: class {
		on() {}
		fit() {}
		setWindow() {}
		destroy() {}
	},
}));

type ElementHelpers = {
	createEl?: (tag: string, options?: { text?: string; cls?: string }) => HTMLElement;
	createDiv?: (cls?: string) => HTMLDivElement;
	empty?: () => void;
	addClass?: (cls: string) => void;
};

const withHelpers = (element: HTMLElement): HTMLElement => {
	const el = element as HTMLElement & ElementHelpers;
	if (!el.createEl) {
		(el as ElementHelpers).createEl = (tag: string, options?: { text?: string; cls?: string }) => {
			const child = withHelpers(document.createElement(tag));
			if (options?.text) {
				child.textContent = options.text;
			}
			if (options?.cls) {
				child.className = options.cls;
			}
			el.appendChild(child);
			return child;
		};
	}

	if (!el.createDiv) {
		(el as ElementHelpers).createDiv = (cls?: string) => {
			const child = withHelpers(document.createElement('div')) as HTMLDivElement;
			if (cls) {
				child.className = cls;
			}
			el.appendChild(child);
			return child;
		};
	}

	if (!el.empty) {
		(el as ElementHelpers).empty = () => {
			el.innerHTML = '';
		};
	}

	if (!el.addClass) {
		(el as ElementHelpers).addClass = (cls: string) => {
			el.classList.add(cls);
		};
	}

	return el;
};

describe('EventModal', () => {
	const manifest: PluginManifest = {
		id: 'test-plugin',
		name: 'Test Plugin',
		version: '0.0.0',
		minAppVersion: '0.0.0',
		description: 'test',
		author: 'test',
		authorUrl: 'https://example.com',
		isDesktopOnly: false,
	};

	const createPlugin = () => {
		const app = new App();
		const plugin = new GoogleCalendarTimelinePlugin(app, manifest);
		plugin.app = app;
		plugin.settings = createMockSettings();
		plugin.noteCreator = {
			createNote: jest.fn().mockResolvedValue(undefined),
		} as unknown as GoogleCalendarTimelinePlugin['noteCreator'];
		return plugin;
	};

	it('renders event details on open', () => {
		const plugin = createPlugin();
		const event = createMockEvent({
			summary: 'Planning Meeting',
			description: 'Discuss goals',
			location: 'Room A',
			attendees: [{ email: 'test@example.com' }],
		});
		const modal = new EventModal(plugin.app, event, plugin);
		(modal as unknown as { contentEl: HTMLElement }).contentEl = withHelpers(modal.contentEl);

		modal.onOpen();

		expect(modal.titleEl.textContent).toBe('Planning Meeting');
		expect(modal.contentEl.querySelector('.event-details')).not.toBeNull();
		expect(modal.contentEl.querySelector('.event-actions')).not.toBeNull();
	});

	it('creates a note and closes', async () => {
		const plugin = createPlugin();
		const event = createMockEvent();
		const modal = new EventModal(plugin.app, event, plugin);
		(modal as unknown as { contentEl: HTMLElement }).contentEl = withHelpers(modal.contentEl);
		const closeSpy = jest.spyOn(modal, 'close');

		modal.onOpen();

		const createButton = modal.contentEl.querySelector(
			'button.mod-cta'
		) as HTMLButtonElement | null;
		expect(createButton).not.toBeNull();

		createButton?.click();
		await new Promise(resolve => setTimeout(resolve, 0));

		expect(plugin.noteCreator.createNote).toHaveBeenCalled();
		expect(closeSpy).toHaveBeenCalled();
		closeSpy.mockRestore();
	});

	it('clears content on close', () => {
		const plugin = createPlugin();
		const event = createMockEvent();
		const modal = new EventModal(plugin.app, event, plugin);
		(modal as unknown as { contentEl: HTMLElement }).contentEl = withHelpers(modal.contentEl);

		modal.onOpen();
		modal.onClose();

		expect(modal.contentEl.innerHTML).toBe('');
	});

	it('renders all-day events without time range', () => {
		const plugin = createPlugin();
		const event = createMockEvent({
			start: { date: '2024-02-01' },
			end: { date: '2024-02-01' },
		});
		const modal = new EventModal(plugin.app, event, plugin);
		(modal as unknown as { contentEl: HTMLElement }).contentEl = withHelpers(modal.contentEl);

		modal.onOpen();

		expect(modal.contentEl.textContent).toContain('All day');
	});

	it('opens event in Google Calendar when button clicked', () => {
		const plugin = createPlugin();
		const event = createMockEvent({ htmlLink: 'https://calendar.google.com/event/123' });
		const modal = new EventModal(plugin.app, event, plugin);
		(modal as unknown as { contentEl: HTMLElement }).contentEl = withHelpers(modal.contentEl);

		const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);

		modal.onOpen();

		const openButton = Array.from(modal.contentEl.querySelectorAll('button')).find(
			btn => btn.textContent === 'Open in Google Calendar'
		);
		expect(openButton).not.toBeNull();
		openButton?.click();

		expect(openSpy).toHaveBeenCalledWith('https://calendar.google.com/event/123', '_blank');
		openSpy.mockRestore();
	});

	it('closes modal when close button clicked', () => {
		const plugin = createPlugin();
		const event = createMockEvent();
		const modal = new EventModal(plugin.app, event, plugin);
		(modal as unknown as { contentEl: HTMLElement }).contentEl = withHelpers(modal.contentEl);

		const closeSpy = jest.spyOn(modal, 'close');

		modal.onOpen();

		const closeButton = Array.from(modal.contentEl.querySelectorAll('button')).find(
			btn => btn.textContent === 'Close'
		);
		expect(closeButton).not.toBeNull();
		closeButton?.click();

		expect(closeSpy).toHaveBeenCalled();
		closeSpy.mockRestore();
	});

	it('renders attendees when present', () => {
		const plugin = createPlugin();
		const event = createMockEvent({
			attendees: [
				{ email: 'alice@example.com', displayName: 'Alice' },
				{ email: 'bob@example.com' },
			],
		});
		const modal = new EventModal(plugin.app, event, plugin);
		(modal as unknown as { contentEl: HTMLElement }).contentEl = withHelpers(modal.contentEl);

		modal.onOpen();

		expect(modal.contentEl.textContent).toContain('Alice');
		expect(modal.contentEl.textContent).toContain('bob@example.com');
	});

	it('does not render location when not provided', () => {
		const plugin = createPlugin();
		const event = createMockEvent({ location: undefined });
		const modal = new EventModal(plugin.app, event, plugin);
		(modal as unknown as { contentEl: HTMLElement }).contentEl = withHelpers(modal.contentEl);

		modal.onOpen();

		expect(modal.contentEl.textContent).not.toContain('📍 Where');
	});

	it('does not render description when not provided', () => {
		const plugin = createPlugin();
		const event = createMockEvent({ description: undefined });
		const modal = new EventModal(plugin.app, event, plugin);
		(modal as unknown as { contentEl: HTMLElement }).contentEl = withHelpers(modal.contentEl);

		modal.onOpen();

		expect(modal.contentEl.textContent).not.toContain('📝 Description');
	});

	it('does not render attendees when not provided', () => {
		const plugin = createPlugin();
		const event = createMockEvent({ attendees: undefined });
		const modal = new EventModal(plugin.app, event, plugin);
		(modal as unknown as { contentEl: HTMLElement }).contentEl = withHelpers(modal.contentEl);

		modal.onOpen();

		expect(modal.contentEl.textContent).not.toContain('👥 Attendees');
	});

	it('formats timed events with start and end time', () => {
		const plugin = createPlugin();
		const event = createMockEvent({
			start: { dateTime: '2024-02-01T10:00:00-05:00' },
			end: { dateTime: '2024-02-01T11:30:00-05:00' },
		});
		const modal = new EventModal(plugin.app, event, plugin);
		(modal as unknown as { contentEl: HTMLElement }).contentEl = withHelpers(modal.contentEl);

		modal.onOpen();

		const content = modal.contentEl.textContent || '';
		expect(content).toContain('📅 When');
		// Should contain time range
		expect(content).toMatch(/\d{1,2}:\d{2}/);
	});
});
