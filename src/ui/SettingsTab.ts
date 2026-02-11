import { App, PluginSettingTab, Setting } from 'obsidian';
import GoogleCalendarTimelinePlugin from '../main';
import { PluginSettings } from '../types/calendar';

/**
 * Settings Tab
 * Plugin configuration interface
 */
export class SettingsTab extends PluginSettingTab {
	plugin: GoogleCalendarTimelinePlugin;

	constructor(app: App, plugin: GoogleCalendarTimelinePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: 'Google Calendar Timeline Settings' });

		// Authentication Section
		containerEl.createEl('h3', { text: 'Authentication' });

		new Setting(containerEl)
			.setName('Google Account')
			.setDesc(
				this.plugin.auth.isAuthenticated() ? '✅ Connected to Google Calendar' : '❌ Not connected'
			)
			.addButton(button => {
				if (this.plugin.auth.isAuthenticated()) {
					button.setButtonText('Disconnect').onClick(async () => {
						await this.plugin.auth.logout();
						this.display();
					});
				} else {
					button
						.setButtonText('Connect')
						.setCta()
						.onClick(async () => {
							await this.plugin.auth.login();
							this.display();
						});
				}
			});

		// Sync Settings
		containerEl.createEl('h3', { text: 'Synchronization' });

		new Setting(containerEl)
			.setName('Auto-sync')
			.setDesc('Automatically sync calendars in the background')
			.addToggle(toggle =>
				toggle.setValue(this.plugin.settings.autoSync).onChange(async value => {
					this.plugin.settings.autoSync = value;
					await this.plugin.saveSettings();
					if (value) {
						this.plugin.syncService.startAutoSync();
					} else {
						this.plugin.syncService.stopAutoSync();
					}
				})
			);

		new Setting(containerEl)
			.setName('Sync interval')
			.setDesc('How often to sync with Google Calendar (minutes)')
			.addText(text =>
				text
					.setPlaceholder('15')
					.setValue(String(this.plugin.settings.syncInterval))
					.onChange(async value => {
						const interval = parseInt(value) || 15;
						this.plugin.settings.syncInterval = interval;
						await this.plugin.saveSettings();
						this.plugin.syncService.restartAutoSync();
					})
			);

		new Setting(containerEl)
			.setName('Sync now')
			.setDesc('Manually trigger calendar sync')
			.addButton(button =>
				button.setButtonText('Sync').onClick(async () => {
					await this.plugin.syncService.syncNow();
				})
			);

		// Display Settings
		containerEl.createEl('h3', { text: 'Display' });

		new Setting(containerEl)
			.setName('Use Google Calendar colors')
			.setDesc('Use original calendar colors from Google')
			.addToggle(toggle =>
				toggle.setValue(this.plugin.settings.useGoogleColors).onChange(async value => {
					this.plugin.settings.useGoogleColors = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName('Show past events')
			.setDesc('Include events that have already passed')
			.addToggle(toggle =>
				toggle.setValue(this.plugin.settings.showPastEvents).onChange(async value => {
					this.plugin.settings.showPastEvents = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName('Start hour')
			.setDesc('Timeline start hour (0-23)')
			.addText(text =>
				text
					.setPlaceholder('8')
					.setValue(String(this.plugin.settings.startHour))
					.onChange(async value => {
						const hour = parseInt(value) || 8;
						this.plugin.settings.startHour = Math.max(0, Math.min(23, hour));
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('End hour')
			.setDesc('Timeline end hour (0-23)')
			.addText(text =>
				text
					.setPlaceholder('20')
					.setValue(String(this.plugin.settings.endHour))
					.onChange(async value => {
						const hour = parseInt(value) || 20;
						this.plugin.settings.endHour = Math.max(0, Math.min(23, hour));
						await this.plugin.saveSettings();
					})
			);

		// Note Settings
		containerEl.createEl('h3', { text: 'Note Creation' });

		new Setting(containerEl)
			.setName('Note location')
			.setDesc('Folder path for created notes (leave empty for root)')
			.addText(text =>
				text
					.setPlaceholder('Calendar/Events')
					.setValue(this.plugin.settings.noteLocation)
					.onChange(async value => {
						this.plugin.settings.noteLocation = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('File naming strategy')
			.setDesc('How to name created note files')
			.addDropdown(dropdown =>
				dropdown
					.addOption('title', 'Event Title')
					.addOption('date-title', 'Date - Title')
					.addOption('custom', 'Custom Template')
					.setValue(this.plugin.settings.fileNamingStrategy)
					.onChange(async (value: PluginSettings['fileNamingStrategy']) => {
						this.plugin.settings.fileNamingStrategy = value;
						await this.plugin.saveSettings();
						this.display();
					})
			);

		if (this.plugin.settings.fileNamingStrategy === 'custom') {
			new Setting(containerEl)
				.setName('Custom filename template')
				.setDesc('Use {{title}}, {{date}}, {{time}}, {{calendar}}, {{id}}')
				.addText(text =>
					text
						.setPlaceholder('{{date}}-{{title}}')
						.setValue(this.plugin.settings.customFileNameTemplate || '')
						.onChange(async value => {
							this.plugin.settings.customFileNameTemplate = value;
							await this.plugin.saveSettings();
						})
				);
		}

		new Setting(containerEl)
			.setName('Open note after creation')
			.setDesc('Automatically open the note after creating it')
			.addToggle(toggle =>
				toggle.setValue(this.plugin.settings.openNoteAfterCreation).onChange(async value => {
					this.plugin.settings.openNoteAfterCreation = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName('Note template')
			.setDesc('Template for created notes (use {{title}}, {{date}}, {{time}}, etc.)')
			.addTextArea(text => {
				text
					.setPlaceholder('Enter note template...')
					.setValue(this.plugin.settings.noteTemplate)
					.onChange(async value => {
						this.plugin.settings.noteTemplate = value;
						await this.plugin.saveSettings();
					});
				text.inputEl.rows = 10;
				text.inputEl.cols = 50;
			});
	}
}
