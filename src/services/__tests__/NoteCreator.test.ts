/**
 * NoteCreator Tests
 */

import { App, TFile } from 'obsidian';
import { createMockEvent, createMockSettings } from '../../__mocks__/factories';
import { NoteCreator } from '../NoteCreator';

// Mock Obsidian
jest.mock('obsidian');

describe('NoteCreator', () => {
	let noteCreator: NoteCreator;
	let mockApp: App;
	let mockSettings: any;
	let consoleErrorSpy: jest.SpyInstance;

	beforeEach(() => {
		consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
		mockApp = new App();
		mockSettings = createMockSettings();
		noteCreator = new NoteCreator(mockApp, mockSettings);
		jest.clearAllMocks();
	});

	afterEach(() => {
		consoleErrorSpy.mockRestore();
	});

	describe('generateFilename', () => {
		it('should generate filename from event title', () => {
			// Arrange
			const event = createMockEvent({ summary: 'Team Meeting' });
			mockSettings.fileNamingStrategy = 'title';

			// Act
			const filename = noteCreator.generateFilename(event);

			// Assert
			expect(filename).toBe('Team Meeting.md');
		});

		it('should use date-title format', () => {
			// Arrange
			const event = createMockEvent({
				summary: 'Meeting',
				start: { dateTime: '2024-01-15T10:00:00Z' },
			});
			mockSettings.fileNamingStrategy = 'date-title';

			// Act
			const filename = noteCreator.generateFilename(event);

			// Assert
			expect(filename).toMatch(/2024-01-15 - Meeting\.md/);
		});

		it('should sanitize invalid filename characters', () => {
			// Arrange
			const event = createMockEvent({ summary: 'Meeting: <Important> | Urgent?' });
			mockSettings.fileNamingStrategy = 'title';

			// Act
			const filename = noteCreator.generateFilename(event);

			// Assert
			expect(filename).toBe('Meeting- -Important- - Urgent-.md');
			expect(filename).not.toMatch(/[<>:"|?*]/);
		});

		it('should apply custom template', () => {
			// Arrange
			const event = createMockEvent({
				summary: 'Meeting',
				start: { dateTime: '2024-01-15T10:00:00Z' },
			});
			mockSettings.fileNamingStrategy = 'custom';
			mockSettings.customFileNameTemplate = '{{date}}-{{title}}';

			// Act
			const filename = noteCreator.generateFilename(event);

			// Assert
			expect(filename).toMatch(/2024-01-15-Meeting\.md/);
		});

		it('should include noteLocation in path', () => {
			// Arrange
			const event = createMockEvent({ summary: 'Meeting' });
			mockSettings.noteLocation = 'Calendar/Events';
			mockSettings.fileNamingStrategy = 'title';

			// Act
			const filename = noteCreator.generateFilename(event);

			// Assert
			expect(filename).toBe('Calendar/Events/Meeting.md');
		});

		it('should limit filename length', () => {
			// Arrange
			const longTitle = 'A'.repeat(300);
			const event = createMockEvent({ summary: longTitle });
			mockSettings.fileNamingStrategy = 'title';

			// Act
			const filename = noteCreator.generateFilename(event);

			// Assert
			expect(filename.length).toBeLessThanOrEqual(204); // 200 + .md
		});
	});

	describe('generateContent', () => {
		it('should replace template variables', () => {
			// Arrange
			const event = createMockEvent({
				summary: 'Team Meeting',
				description: 'Discuss Q1 goals',
				location: 'Conference Room A',
			});
			mockSettings.noteTemplate = `# {{title}}

**Location:** {{location}}

## Description
{{description}}`;

			// Act
			const content = noteCreator.generateContent(event);

			// Assert
			expect(content).toContain('# Team Meeting');
			expect(content).toContain('**Location:** Conference Room A');
			expect(content).toContain('Discuss Q1 goals');
		});

		it('should format date correctly', () => {
			// Arrange
			const event = createMockEvent({
				start: { dateTime: '2024-01-15T10:00:00Z' },
			});
			mockSettings.noteTemplate = 'Date: {{date}}';

			// Act
			const content = noteCreator.generateContent(event);

			// Assert
			expect(content).toMatch(/Date: \w+, \w+ \d+, \d{4}/);
		});

		it('should format time range', () => {
			// Arrange
			const event = createMockEvent({
				start: { dateTime: '2024-01-15T10:00:00Z' },
				end: { dateTime: '2024-01-15T11:00:00Z' },
			});
			mockSettings.noteTemplate = 'Time: {{time}}';

			// Act
			const content = noteCreator.generateContent(event);

			// Assert
			expect(content).toContain('Time:');
			expect(content).toMatch(/\d+:\d+ (AM|PM) - \d+:\d+ (AM|PM)/);
		});

		it('should handle all-day events', () => {
			// Arrange
			const event = createMockEvent({
				start: { date: '2024-01-15' },
				end: { date: '2024-01-15' },
			});
			mockSettings.noteTemplate = 'Time: {{time}}';

			// Act
			const content = noteCreator.generateContent(event);

			// Assert
			expect(content).toContain('Time: All day');
		});

		it('should format attendees list', () => {
			// Arrange
			const event = createMockEvent({
				attendees: [
					{ email: 'john@example.com', displayName: 'John Doe', responseStatus: 'accepted' },
					{ email: 'jane@example.com', displayName: 'Jane Smith', responseStatus: 'tentative' },
				],
			});
			mockSettings.noteTemplate = 'Attendees:\n{{attendees}}';

			// Act
			const content = noteCreator.generateContent(event);

			// Assert
			expect(content).toContain('- John Doe (accepted)');
			expect(content).toContain('- Jane Smith (tentative)');
		});

		it('should handle missing optional fields', () => {
			// Arrange
			const event = createMockEvent({
				description: undefined,
				location: undefined,
				attendees: undefined,
			});
			mockSettings.noteTemplate = `Description: {{description}}
Location: {{location}}
Attendees: {{attendees}}`;

			// Act
			const content = noteCreator.generateContent(event);

			// Assert
			expect(content).toContain('Description: No description');
			expect(content).toContain('Location: No location');
			expect(content).toContain('Attendees: No attendees');
		});

		it('should include calendar link', () => {
			// Arrange
			const event = createMockEvent({
				htmlLink: 'https://calendar.google.com/event?eid=123',
			});
			mockSettings.noteTemplate = '[Open in Calendar]({{link}})';

			// Act
			const content = noteCreator.generateContent(event);

			// Assert
			expect(content).toContain('[Open in Calendar](https://calendar.google.com/event?eid=123)');
		});

		it('should escape markdown characters', () => {
			// Arrange
			const event = createMockEvent({
				summary: 'Meeting *Important* _Urgent_',
				description: '# Header\n**Bold** text',
			});
			mockSettings.noteTemplate = '{{title}}\n\n{{description}}';

			// Act
			const content = noteCreator.generateContent(event);

			// Assert
			expect(content).toContain('\\*Important\\*');
			expect(content).toContain('\\_Urgent\\_');
		});
	});

	describe('createNote', () => {
		it('should create note file', async () => {
			// Arrange
			const event = createMockEvent({ summary: 'Team Meeting' });
			const expectedFile = { path: 'Team Meeting.md', name: 'Team Meeting.md' };
			(mockApp.vault.create as jest.Mock).mockResolvedValue(expectedFile);

			// Act
			const file = await noteCreator.createNote(event);

			// Assert
			expect(mockApp.vault.create).toHaveBeenCalledWith(
				expect.stringContaining('Team Meeting.md'),
				expect.any(String)
			);
			expect(file).toBe(expectedFile);
		});

		it('should open note after creation if configured', async () => {
			// Arrange
			const event = createMockEvent();
			mockSettings.openNoteAfterCreation = true;
			const mockLeaf = { openFile: jest.fn() };
			(mockApp.workspace.getLeaf as jest.Mock).mockReturnValue(mockLeaf);

			// Act
			await noteCreator.createNote(event);

			// Assert
			expect(mockLeaf.openFile).toHaveBeenCalled();
		});

		it('should not open note if configured not to', async () => {
			// Arrange
			const event = createMockEvent();
			mockSettings.openNoteAfterCreation = false;

			// Act
			await noteCreator.createNote(event);

			// Assert
			expect(mockApp.workspace.getLeaf).not.toHaveBeenCalled();
		});

		it('should handle existing files', async () => {
			// Arrange
			const event = createMockEvent({ summary: 'Existing Note' });
			mockSettings.fileNamingStrategy = 'title';
			const existingFile = Object.assign(new TFile(), { path: 'Existing Note.md' });
			(mockApp.vault.getAbstractFileByPath as jest.Mock).mockReturnValue(existingFile);
			const confirmMock = jest.fn().mockReturnValue(false);
			const containerEl = document.createElement('div');
			(containerEl.ownerDocument.defaultView as any).confirm = confirmMock;
			mockApp.workspace.activeLeaf = { view: { containerEl } } as any;

			// Act
			const file = await noteCreator.createNote(event);

			// Assert
			expect(mockApp.vault.delete).not.toHaveBeenCalled();
			expect(file).toBe(existingFile);
		});

		it('should overwrite existing file if confirmed', async () => {
			// Arrange
			const event = createMockEvent({ summary: 'Existing Note' });
			mockSettings.fileNamingStrategy = 'title';
			const existingFile = Object.assign(new TFile(), { path: 'Existing Note.md' });
			const newFile = Object.assign(new TFile(), { path: 'Existing Note.md' });
			(mockApp.vault.getAbstractFileByPath as jest.Mock).mockReturnValue(existingFile);
			(mockApp.vault.create as jest.Mock).mockResolvedValue(newFile);
			const confirmMock = jest.fn().mockReturnValue(true);
			const containerEl = document.createElement('div');
			(containerEl.ownerDocument.defaultView as any).confirm = confirmMock;
			mockApp.workspace.activeLeaf = { view: { containerEl } } as any;

			// Act
			await noteCreator.createNote(event);
			(mockApp.vault.create as jest.Mock).mockRejectedValue(new Error('Write error'));

			// Act & Assert
			await expect(noteCreator.createNote(event)).rejects.toThrow('Write error');
		});
	});

	describe('createNotesFromEvents', () => {
		it('should create notes for multiple events', async () => {
			// Arrange
			const event1 = createMockEvent({ id: '1', summary: 'Meeting 1' });
			const event2 = createMockEvent({ id: '2', summary: 'Meeting 2' });
			const file1 = { path: 'Meeting 1.md', name: 'Meeting 1.md' };
			const file2 = { path: 'Meeting 2.md', name: 'Meeting 2.md' };

			(mockApp.vault.create as jest.Mock).mockResolvedValueOnce(file1).mockResolvedValueOnce(file2);

			// Act
			const files = await noteCreator.createNotesFromEvents([event1, event2]);

			// Assert
			expect(files).toHaveLength(2);
			expect(mockApp.vault.create).toHaveBeenCalledTimes(2);
		});

		it('should continue on individual failures', async () => {
			// Arrange
			const event1 = createMockEvent({ id: '1', summary: 'Meeting 1' });
			const event2 = createMockEvent({ id: '2', summary: 'Meeting 2' });
			const file2 = { path: 'Meeting 2.md', name: 'Meeting 2.md' };

			(mockApp.vault.create as jest.Mock)
				.mockRejectedValueOnce(new Error('Failed'))
				.mockResolvedValueOnce(file2);

			// Act
			const files = await noteCreator.createNotesFromEvents([event1, event2]);

			// Assert
			expect(files).toHaveLength(1);
			expect(files[0]).toBe(file2);
		});
	});
});
