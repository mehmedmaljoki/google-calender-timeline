import { App, PluginManifest } from 'obsidian';
import { createMockSettings } from '../../__mocks__/factories';
import GoogleCalendarTimelinePlugin from '../../main';
import { SettingsTab } from '../SettingsTab';

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

type TestUtils = {
	buttonClicks: Array<() => void>;
	toggleChanges: Array<(value: boolean) => void>;
	textChanges: Array<(value: string) => void>;
	dropdownChanges: Array<(value: string) => void>;
};

const getTestUtils = (): TestUtils => {
	const mocked = jest.requireMock('obsidian') as { __testUtils: TestUtils };
	return mocked.__testUtils;
};

describe('SettingsTab', () => {
	beforeEach(() => {
		const utils = getTestUtils();
		utils.buttonClicks.length = 0;
		utils.toggleChanges.length = 0;
		utils.textChanges.length = 0;
		utils.dropdownChanges.length = 0;
	});
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

	const createPlugin = (isAuthenticated: boolean): GoogleCalendarTimelinePlugin => {
		const app = new App();
		const plugin = new GoogleCalendarTimelinePlugin(app, manifest);
		plugin.app = app;
		plugin.settings = createMockSettings();
		plugin.auth = {
			isAuthenticated: jest.fn().mockReturnValue(isAuthenticated),
			login: jest.fn().mockResolvedValue(undefined),
			logout: jest.fn().mockResolvedValue(undefined),
		} as unknown as GoogleCalendarTimelinePlugin['auth'];
		plugin.syncService = {
			startAutoSync: jest.fn(),
			stopAutoSync: jest.fn(),
			restartAutoSync: jest.fn(),
			syncNow: jest.fn(),
		} as unknown as GoogleCalendarTimelinePlugin['syncService'];
		plugin.saveSettings = jest.fn().mockResolvedValue(undefined);
		return plugin;
	};

	it('renders settings sections when authenticated', async () => {
		const plugin = createPlugin(true);
		const tab = new SettingsTab(plugin.app, plugin);
		(tab as unknown as { containerEl: HTMLElement }).containerEl = withHelpers(
			document.createElement('div')
		);

		tab.display();

		const container = (tab as unknown as { containerEl: HTMLElement }).containerEl;
		const title = container.querySelector('h2');
		expect(title?.textContent).toBe('Google Calendar Timeline Settings');
		expect(container.querySelectorAll('h3').length).toBeGreaterThan(0);
		const utils = getTestUtils();
		expect(utils.toggleChanges.length).toBeGreaterThan(0);

		await utils.toggleChanges[0](true);
		expect(plugin.syncService.startAutoSync).toHaveBeenCalled();

		await utils.toggleChanges[0](false);
		expect(plugin.syncService.stopAutoSync).toHaveBeenCalled();
	});

	it('renders settings sections when not authenticated', () => {
		const plugin = createPlugin(false);
		const tab = new SettingsTab(plugin.app, plugin);
		(tab as unknown as { containerEl: HTMLElement }).containerEl = withHelpers(
			document.createElement('div')
		);

		tab.display();

		const container = (tab as unknown as { containerEl: HTMLElement }).containerEl;
		const title = container.querySelector('h2');
		expect(title?.textContent).toBe('Google Calendar Timeline Settings');
		expect(container.querySelectorAll('h3').length).toBeGreaterThan(0);
	});

	it('renders custom filename template section when configured', async () => {
		const plugin = createPlugin(true);
		plugin.settings.fileNamingStrategy = 'custom';
		const tab = new SettingsTab(plugin.app, plugin);
		(tab as unknown as { containerEl: HTMLElement }).containerEl = withHelpers(
			document.createElement('div')
		);

		tab.display();

		const container = (tab as unknown as { containerEl: HTMLElement }).containerEl;
		expect(container.querySelectorAll('h3').length).toBeGreaterThan(0);

		const utils = getTestUtils();
		expect(utils.dropdownChanges.length).toBeGreaterThan(0);
		await utils.dropdownChanges[0]('custom');
		expect(plugin.settings.fileNamingStrategy).toBe('custom');
	});
});
