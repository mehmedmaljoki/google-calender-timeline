import { App, PluginManifest } from 'obsidian';
import { GoogleAuth } from '../auth/GoogleAuth';
import GoogleCalendarTimelinePlugin from '../main';
import { SyncService } from '../services/SyncService';
import { VIEW_TYPE_TIMELINE } from '../ui/TimelineView';

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

describe('GoogleCalendarTimelinePlugin', () => {
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

	const setupPlugin = () => {
		const app = new App();
		const plugin = new GoogleCalendarTimelinePlugin(app, manifest);
		plugin.app = app;
		plugin.loadData = jest.fn().mockResolvedValue({ autoSync: false });
		(plugin as unknown as { registerView: jest.Mock }).registerView = jest.fn();
		(plugin as unknown as { addRibbonIcon: jest.Mock }).addRibbonIcon = jest.fn();
		(plugin as unknown as { addCommand: jest.Mock }).addCommand = jest.fn();
		(plugin as unknown as { addSettingTab: jest.Mock }).addSettingTab = jest.fn();
		(plugin.app.workspace as unknown as { detachLeavesOfType: jest.Mock }).detachLeavesOfType =
			jest.fn();
		return plugin;
	};

	it('registers views, commands, and settings on load', async () => {
		const plugin = setupPlugin();
		const commands: Array<{ id: string; callback: () => Promise<void> | void }> = [];
		(plugin as unknown as { addCommand: jest.Mock }).addCommand.mockImplementation(command => {
			commands.push(command);
		});

		await plugin.onload();

		expect((plugin as unknown as { registerView: jest.Mock }).registerView).toHaveBeenCalled();
		expect((plugin as unknown as { addRibbonIcon: jest.Mock }).addRibbonIcon).toHaveBeenCalled();
		expect((plugin as unknown as { addCommand: jest.Mock }).addCommand).toHaveBeenCalled();
		expect((plugin as unknown as { addSettingTab: jest.Mock }).addSettingTab).toHaveBeenCalled();
		expect(commands.length).toBeGreaterThan(0);
	});

	it('starts auto sync when enabled and authenticated', async () => {
		const plugin = setupPlugin();
		plugin.loadData = jest.fn().mockResolvedValue({ autoSync: true });
		const authSpy = jest.spyOn(GoogleAuth.prototype, 'isAuthenticated').mockReturnValue(true);
		const syncSpy = jest.spyOn(SyncService.prototype, 'startAutoSync');
		const syncNowSpy = jest.spyOn(SyncService.prototype, 'syncNow').mockResolvedValue(undefined);

		await plugin.onload();

		expect(syncSpy).toHaveBeenCalled();

		authSpy.mockRestore();
		syncSpy.mockRestore();
		syncNowSpy.mockRestore();
	});

	it('runs command callbacks for connect, disconnect, and sync', async () => {
		const plugin = setupPlugin();
		const commands: Array<{ id: string; callback: () => Promise<void> | void }> = [];
		const syncSpy = jest.spyOn(SyncService.prototype, 'syncNow').mockResolvedValue(undefined);
		const loginSpy = jest.spyOn(GoogleAuth.prototype, 'login').mockResolvedValue(undefined);
		const logoutSpy = jest.spyOn(GoogleAuth.prototype, 'logout').mockResolvedValue(undefined);
		const authSpy = jest.spyOn(GoogleAuth.prototype, 'isAuthenticated');

		(plugin as unknown as { addCommand: jest.Mock }).addCommand.mockImplementation(command => {
			commands.push(command);
		});

		await plugin.onload();

		const connect = commands.find(cmd => cmd.id === 'connect-google');
		const disconnect = commands.find(cmd => cmd.id === 'disconnect-google');
		const syncNow = commands.find(cmd => cmd.id === 'sync-now');

		authSpy.mockReturnValueOnce(false);
		await connect?.callback();
		expect(loginSpy).toHaveBeenCalled();

		authSpy.mockReturnValueOnce(true);
		await disconnect?.callback();
		expect(logoutSpy).toHaveBeenCalled();

		authSpy.mockReturnValueOnce(true);
		await syncNow?.callback();
		expect(syncSpy).toHaveBeenCalled();

		authSpy.mockRestore();
		loginSpy.mockRestore();
		logoutSpy.mockRestore();
		syncSpy.mockRestore();
	});

	it('handles connect and disconnect when already in desired state', async () => {
		const plugin = setupPlugin();
		const commands: Array<{ id: string; callback: () => Promise<void> | void }> = [];
		const loginSpy = jest.spyOn(GoogleAuth.prototype, 'login').mockResolvedValue(undefined);
		const logoutSpy = jest.spyOn(GoogleAuth.prototype, 'logout').mockResolvedValue(undefined);
		const authSpy = jest.spyOn(GoogleAuth.prototype, 'isAuthenticated');

		(plugin as unknown as { addCommand: jest.Mock }).addCommand.mockImplementation(command => {
			commands.push(command);
		});

		await plugin.onload();

		const connect = commands.find(cmd => cmd.id === 'connect-google');
		const disconnect = commands.find(cmd => cmd.id === 'disconnect-google');

		authSpy.mockReturnValueOnce(true);
		await connect?.callback();
		expect(loginSpy).not.toHaveBeenCalled();

		authSpy.mockReturnValueOnce(false);
		await disconnect?.callback();
		expect(logoutSpy).not.toHaveBeenCalled();

		authSpy.mockRestore();
		loginSpy.mockRestore();
		logoutSpy.mockRestore();
	});

	it('activates existing timeline view', async () => {
		const plugin = setupPlugin();
		const leaf = { id: 'leaf' } as unknown as ReturnType<
			typeof plugin.app.workspace.getLeavesOfType
		>[number];
		(plugin.app.workspace.getLeavesOfType as jest.Mock).mockReturnValue([leaf]);
		const revealSpy = plugin.app.workspace.revealLeaf as jest.Mock;

		await plugin.activateView();

		expect(revealSpy).toHaveBeenCalledWith(leaf);
	});

	it('creates and reveals a new timeline view when missing', async () => {
		const plugin = setupPlugin();
		(plugin.app.workspace.getLeavesOfType as jest.Mock).mockReturnValue([]);
		const rightLeaf = { setViewState: jest.fn() } as unknown as NonNullable<
			ReturnType<typeof plugin.app.workspace.getRightLeaf>
		>;
		(plugin.app.workspace.getRightLeaf as jest.Mock).mockReturnValue(rightLeaf);
		const revealSpy = plugin.app.workspace.revealLeaf as jest.Mock;

		await plugin.activateView();

		expect(rightLeaf.setViewState).toHaveBeenCalledWith({
			type: VIEW_TYPE_TIMELINE,
			active: true,
		});
		expect(revealSpy).toHaveBeenCalledWith(rightLeaf);
	});

	it('does not reveal a view when no leaf is available', async () => {
		const plugin = setupPlugin();
		(plugin.app.workspace.getLeavesOfType as jest.Mock).mockReturnValue([]);
		(plugin.app.workspace.getRightLeaf as jest.Mock).mockReturnValue(null);
		const revealSpy = plugin.app.workspace.revealLeaf as jest.Mock;

		await plugin.activateView();

		expect(revealSpy).not.toHaveBeenCalled();
	});

	it('stops sync on unload', async () => {
		const plugin = setupPlugin();
		await plugin.onload();
		const stopSpy = jest.spyOn(plugin.syncService, 'stopAutoSync');

		plugin.onunload();

		expect(stopSpy).toHaveBeenCalled();
		// Note: We don't detach leaves on unload as per Obsidian recommendations
		// This allows users to keep their view positions when reloading the plugin
	});

	it('activates view when ribbon icon is clicked', async () => {
		const plugin = setupPlugin();
		let ribbonCallback: (() => void) | undefined;
		(plugin as unknown as { addRibbonIcon: jest.Mock }).addRibbonIcon.mockImplementation(
			(_icon: string, _title: string, callback: () => void) => {
				ribbonCallback = callback;
			}
		);
		const activateViewSpy = jest.spyOn(plugin, 'activateView').mockResolvedValue(undefined);

		await plugin.onload();

		expect(ribbonCallback).toBeDefined();
		ribbonCallback?.();

		expect(activateViewSpy).toHaveBeenCalled();
		activateViewSpy.mockRestore();
	});

	it('runs open-timeline command', async () => {
		const plugin = setupPlugin();
		const commands: Array<{ id: string; callback: () => Promise<void> | void }> = [];
		(plugin as unknown as { addCommand: jest.Mock }).addCommand.mockImplementation(command => {
			commands.push(command);
		});
		const activateViewSpy = jest.spyOn(plugin, 'activateView').mockResolvedValue(undefined);

		await plugin.onload();

		const openTimeline = commands.find(cmd => cmd.id === 'open-timeline');
		expect(openTimeline).toBeDefined();

		await openTimeline?.callback();

		expect(activateViewSpy).toHaveBeenCalled();
		activateViewSpy.mockRestore();
	});

	it('handles sync-now command when not authenticated', async () => {
		const plugin = setupPlugin();
		const commands: Array<{ id: string; callback: () => Promise<void> | void }> = [];
		const syncSpy = jest.spyOn(SyncService.prototype, 'syncNow').mockResolvedValue(undefined);
		const authSpy = jest.spyOn(GoogleAuth.prototype, 'isAuthenticated');

		(plugin as unknown as { addCommand: jest.Mock }).addCommand.mockImplementation(command => {
			commands.push(command);
		});

		await plugin.onload();

		const syncNow = commands.find(cmd => cmd.id === 'sync-now');

		authSpy.mockReturnValueOnce(false);
		await syncNow?.callback();

		expect(syncSpy).not.toHaveBeenCalled();

		authSpy.mockRestore();
		syncSpy.mockRestore();
	});

	it('handles errors in sync-now command', async () => {
		const plugin = setupPlugin();
		const commands: Array<{ id: string; callback: () => Promise<void> | void }> = [];
		const error = new Error('Sync failed');
		const syncSpy = jest.spyOn(SyncService.prototype, 'syncNow').mockRejectedValue(error);
		const authSpy = jest.spyOn(GoogleAuth.prototype, 'isAuthenticated').mockReturnValue(true);
		const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

		(plugin as unknown as { addCommand: jest.Mock }).addCommand.mockImplementation(command => {
			commands.push(command);
		});

		await plugin.onload();

		const syncNow = commands.find(cmd => cmd.id === 'sync-now');

		await syncNow?.callback();

			expect(consoleErrorSpy).toHaveBeenCalledWith('Sync error:', error);
		syncSpy.mockRestore();
		consoleErrorSpy.mockRestore();
	});

	it('handles errors in connect command', async () => {
		const plugin = setupPlugin();
		const commands: Array<{ id: string; callback: () => Promise<void> | void }> = [];
		const error = new Error('Login failed');
		const loginSpy = jest.spyOn(GoogleAuth.prototype, 'login').mockRejectedValue(error);
		const authSpy = jest.spyOn(GoogleAuth.prototype, 'isAuthenticated').mockReturnValue(false);
		const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

		(plugin as unknown as { addCommand: jest.Mock }).addCommand.mockImplementation(command => {
			commands.push(command);
		});

		await plugin.onload();

		const connect = commands.find(cmd => cmd.id === 'connect-google');

		await connect?.callback();

		expect(consoleErrorSpy).toHaveBeenCalledWith('Login failed:', error);

		authSpy.mockRestore();
		loginSpy.mockRestore();
		consoleErrorSpy.mockRestore();
	});

	it('handles errors in disconnect command', async () => {
		const plugin = setupPlugin();
		const commands: Array<{ id: string; callback: () => Promise<void> | void }> = [];
		const error = new Error('Logout failed');
		const logoutSpy = jest.spyOn(GoogleAuth.prototype, 'logout').mockRejectedValue(error);
		const authSpy = jest.spyOn(GoogleAuth.prototype, 'isAuthenticated').mockReturnValue(true);
		const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

		(plugin as unknown as { addCommand: jest.Mock }).addCommand.mockImplementation(command => {
			commands.push(command);
		});

		await plugin.onload();

		const disconnect = commands.find(cmd => cmd.id === 'disconnect-google');

		await disconnect?.callback();

		expect(consoleErrorSpy).toHaveBeenCalledWith('Logout failed:', error);

		authSpy.mockRestore();
		logoutSpy.mockRestore();
		consoleErrorSpy.mockRestore();
	});
});
