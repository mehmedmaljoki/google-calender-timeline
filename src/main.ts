import { Notice, Plugin, WorkspaceLeaf } from 'obsidian';
import { CalendarAPI } from './api/CalendarAPI';
import { GoogleAuth } from './auth/GoogleAuth';
import { TokenManager } from './auth/TokenManager';
import { NoteCreator } from './services/NoteCreator';
import { SyncService } from './services/SyncService';
import { DEFAULT_SETTINGS, PluginSettings } from './types/calendar';
import { SettingsTab } from './ui/SettingsTab';
import { TimelineView, VIEW_TYPE_TIMELINE } from './ui/TimelineView';

/**
 * Google Calendar Timeline Plugin
 * Main entry point for the plugin
 */
export default class GoogleCalendarTimelinePlugin extends Plugin {
	settings!: PluginSettings;
	auth!: GoogleAuth;
	tokenManager!: TokenManager;
	api!: CalendarAPI;
	syncService!: SyncService;
	noteCreator!: NoteCreator;

	async onload() {
		// Load settings
		await this.loadSettings();

		// Initialize services
		this.tokenManager = new TokenManager(this);
		this.auth = new GoogleAuth(this.tokenManager);
		this.api = new CalendarAPI(this.auth);
		this.syncService = new SyncService(this, this.api);
		this.noteCreator = new NoteCreator(this.app, this.settings);

		// Register timeline view
		this.registerView(VIEW_TYPE_TIMELINE, leaf => new TimelineView(leaf, this));

		// Add ribbon icon
		this.addRibbonIcon('calendar', 'Open calendar timeline', () => {
			void this.activateView();
		});

		// Add commands
		this.addCommand({
			id: 'open-timeline',
			name: 'Open timeline',
			callback: () => {
				void this.activateView();
			},
		});

		this.addCommand({
			id: 'sync-now',
			name: 'Sync calendars now',
			icon: 'refresh-cw',
			callback: async () => {
				if (!this.auth.isAuthenticated()) {
					new Notice('Please connect to Google calendar first');
					return;
				}
				try {
					new Notice('Syncing calendars...');
					await this.syncService.syncNow();
					new Notice('Sync completed successfully');
				} catch (error) {
					const message = error instanceof Error ? error.message : 'Unknown error';
					new Notice('Sync failed: ' + message);
					console.error('Sync error:', error);
				}
			},
		});

		this.addCommand({
			id: 'connect-google',
			name: 'Connect to Google calendar',
			callback: async () => {
				if (this.auth.isAuthenticated()) {
					new Notice('Already connected to Google calendar');
					return;
				}
				try {
					await this.auth.login();
				} catch (error) {
					const message = error instanceof Error ? error.message : 'Unknown error';
					new Notice('Login failed: ' + message);
					console.error('Login failed:', error);
				}
			},
		});

		this.addCommand({
			id: 'disconnect-google',
			name: 'Disconnect from Google calendar',
			callback: async () => {
				if (!this.auth.isAuthenticated()) {
					new Notice('Not connected to Google calendar');
					return;
				}
				try {
					await this.auth.logout();
					new Notice('Disconnected from Google calendar');
				} catch (error) {
					const message = error instanceof Error ? error.message : 'Unknown error';
					new Notice('Logout failed: ' + message);
					console.error('Logout failed:', error);
				}
			},
		});

		// Add settings tab
		this.addSettingTab(new SettingsTab(this.app, this));

		// Start auto-sync if enabled
		if (this.settings.autoSync && this.auth.isAuthenticated()) {
			this.syncService.startAutoSync();
		}

		// Auto-sync is managed by individual commands
		// Authentication changes will be handled by the auth service
	}

	onunload(): void {
		// Stop auto-sync
		this.syncService.stopAutoSync();

		// Note: Don't detach leaves as that will reset the leaf to its default location
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async activateView() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_TIMELINE);

		if (leaves.length > 0) {
			// Timeline view already exists, reveal it
			leaf = leaves[0];
		} else {
			// Create new timeline view in right sidebar
			const rightLeaf = workspace.getRightLeaf(false);
			if (rightLeaf) {
				leaf = rightLeaf;
				await leaf.setViewState({
					type: VIEW_TYPE_TIMELINE,
					active: true,
				});
			}
		}

		// Reveal the leaf
		if (leaf) {
			void workspace.revealLeaf(leaf);
		}
	}
}
