import { App, PluginManifest, WorkspaceLeaf } from 'obsidian';
import { createMockEvent, createMockSettings } from '../../__mocks__/factories';
import GoogleCalendarTimelinePlugin from '../../main';
import { EventModal } from '../EventModal';
import { TimelineView } from '../TimelineView';

jest.mock('obsidian');

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

type TimelineHandlers = Record<string, (props: { items?: string[]; item?: string }) => void>;

const mockTimelineInstances: Array<{
	itemsData: { items: unknown[]; clear: jest.Mock; add: jest.Mock };
	handlers: TimelineHandlers;
	fit: jest.Mock;
	setWindow: jest.Mock;
	destroy: jest.Mock;
	trigger: (event: keyof TimelineHandlers, props: { items: string[]; item?: string }) => void;
}> = [];

jest.mock('vis-timeline/standalone', () => {
	class MockDataSet<T> {
		items: T[];
		clear = jest.fn(() => {
			this.items = [];
		});
		add = jest.fn((newItems: T[]) => {
			this.items.push(...newItems);
		});

		constructor(items: T[] = []) {
			this.items = [...items];
		}
	}

	class MockTimeline {
		itemsData: MockDataSet<unknown>;
		handlers: TimelineHandlers = {};
		fit = jest.fn();
		setWindow = jest.fn();
		destroy = jest.fn();

		constructor(_container: HTMLElement, items: MockDataSet<unknown>, _options: unknown) {
			this.itemsData = items;
			mockTimelineInstances.push({
				itemsData: this.itemsData,
				handlers: this.handlers,
				fit: this.fit,
				setWindow: this.setWindow,
				destroy: this.destroy,
				trigger: (event, props) => {
					const handler = this.handlers[event];
					if (handler) {
						handler(props);
					}
				},
			});
		}

		on(event: string, cb: (props: { items?: string[]; item?: string }) => void) {
			this.handlers[event] = cb;
		}
	}

	return { DataSet: MockDataSet, Timeline: MockTimeline };
});

describe('TimelineView', () => {
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

	beforeEach(() => {
		mockTimelineInstances.length = 0;
	});

	const createPlugin = (events = [createMockEvent()]) => {
		const app = new App();
		const plugin = new GoogleCalendarTimelinePlugin(app, manifest);
		plugin.app = app;
		plugin.settings = createMockSettings();
		plugin.noteCreator = {
			createNote: jest.fn().mockResolvedValue(undefined),
		} as unknown as GoogleCalendarTimelinePlugin['noteCreator'];
		plugin.syncService = {
			getEventsForDay: jest.fn().mockReturnValue(events),
			getAllEvents: jest.fn().mockReturnValue(events),
		} as unknown as GoogleCalendarTimelinePlugin['syncService'];
		return plugin;
	};

	it('renders and fits timeline on open', async () => {
		const plugin = createPlugin();
		const leaf = new WorkspaceLeaf();
		const view = new TimelineView(leaf, plugin);
		(view as unknown as { contentEl: HTMLElement }).contentEl = withHelpers(view.contentEl);
		(view as unknown as { containerEl: HTMLElement }).containerEl = withHelpers(view.containerEl);

		await view.onOpen();

		expect(mockTimelineInstances.length).toBe(1);
		const timeline = mockTimelineInstances[0];
		expect(timeline.itemsData.items.length).toBeGreaterThan(0);
		expect(timeline.fit).toHaveBeenCalled();
	});

	it('skips fit when there are no events', async () => {
		const plugin = createPlugin([]);
		const leaf = new WorkspaceLeaf();
		const view = new TimelineView(leaf, plugin);
		(view as unknown as { contentEl: HTMLElement }).contentEl = withHelpers(view.contentEl);
		(view as unknown as { containerEl: HTMLElement }).containerEl = withHelpers(view.containerEl);

		await view.onOpen();

		const timeline = mockTimelineInstances[0];
		expect(timeline.fit).not.toHaveBeenCalled();
	});

	it('opens event modal on select', async () => {
		const plugin = createPlugin();
		const leaf = new WorkspaceLeaf();
		const view = new TimelineView(leaf, plugin);
		(view as unknown as { contentEl: HTMLElement }).contentEl = withHelpers(view.contentEl);
		(view as unknown as { containerEl: HTMLElement }).containerEl = withHelpers(view.containerEl);
		const openSpy = jest.spyOn(EventModal.prototype, 'open').mockImplementation(() => undefined);

		await view.onOpen();

		const timeline = mockTimelineInstances[0];
		timeline.trigger('select', { items: ['event-123'] });

		expect(openSpy).toHaveBeenCalled();
		openSpy.mockRestore();
	});

	it('creates note on double click', async () => {
		const plugin = createPlugin();
		const leaf = new WorkspaceLeaf();
		const view = new TimelineView(leaf, plugin);
		(view as unknown as { contentEl: HTMLElement }).contentEl = withHelpers(view.contentEl);
		(view as unknown as { containerEl: HTMLElement }).containerEl = withHelpers(view.containerEl);

		await view.onOpen();

		const timeline = mockTimelineInstances[0];
		timeline.trigger('doubleClick', { items: [], item: 'event-123' });

		expect(plugin.noteCreator.createNote).toHaveBeenCalled();
	});

	it('does not open a modal when the event is missing', async () => {
		const plugin = createPlugin([]);
		const leaf = new WorkspaceLeaf();
		const view = new TimelineView(leaf, plugin);
		(view as unknown as { contentEl: HTMLElement }).contentEl = withHelpers(view.contentEl);
		(view as unknown as { containerEl: HTMLElement }).containerEl = withHelpers(view.containerEl);
		const openSpy = jest.spyOn(EventModal.prototype, 'open').mockImplementation(() => undefined);

		await view.onOpen();

		const timeline = mockTimelineInstances[0];
		timeline.trigger('select', { items: ['missing-event'] });

		expect(openSpy).not.toHaveBeenCalled();
		openSpy.mockRestore();
	});

	it('updates the date display without an element parameter', async () => {
		const plugin = createPlugin([]);
		const leaf = new WorkspaceLeaf();
		const view = new TimelineView(leaf, plugin);
		(view as unknown as { contentEl: HTMLElement }).contentEl = withHelpers(view.contentEl);
		(view as unknown as { containerEl: HTMLElement }).containerEl = withHelpers(view.containerEl);

		await view.onOpen();

		(view as unknown as { updateDateDisplay: (element?: HTMLElement) => void }).updateDateDisplay();
		const dateEl = view.contentEl.querySelector('.current-date');
		expect(dateEl?.textContent).toBeTruthy();
	});

	it('returns early when refreshing without a timeline', () => {
		const plugin = createPlugin([]);
		const leaf = new WorkspaceLeaf();
		const view = new TimelineView(leaf, plugin);

		(view as unknown as { refreshTimeline: () => void }).refreshTimeline();
		expect(true).toBe(true);
	});
});
