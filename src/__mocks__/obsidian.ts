/**
 * Mock for Obsidian API
 */

export class Notice {
	constructor(public message: string) {
		// Mock implementation
	}
}

export class Plugin {
	app: any;
	manifest: any;

	async loadData(): Promise<any> {
		return {};
	}

	async saveData(_data: any): Promise<void> {
		// Mock implementation
	}
}

export class PluginSettingTab {
	constructor(
		public app: any,
		public plugin: any
	) {}

	display(): void {
		// Mock implementation
	}

	hide(): void {
		// Mock implementation
	}
}

export class Setting {
	constructor(public containerEl: HTMLElement) {}

	setName(_name: string): this {
		return this;
	}

	setDesc(_desc: string): this {
		return this;
	}

	addButton(cb: (button: any) => any): this {
		cb({
			setButtonText: (_text: string) => ({ onClick: (_cb: () => void) => {} }),
			setCta: () => ({ onClick: (_cb: () => void) => {} }),
			onClick: (_cb: () => void) => {},
		});
		return this;
	}

	addToggle(cb: (toggle: any) => any): this {
		cb({
			setValue: (_value: boolean) => ({ onChange: (_cb: (value: boolean) => void) => {} }),
			onChange: (_cb: (value: boolean) => void) => {},
		});
		return this;
	}

	addText(cb: (text: any) => any): this {
		cb({
			setPlaceholder: (_text: string) => ({
				setValue: (_value: string) => ({ onChange: (_cb: (value: string) => void) => {} }),
			}),
			setValue: (_value: string) => ({
				onChange: (_cb: (value: string) => void) => {},
			}),
			onChange: (_cb: (value: string) => void) => {},
		});
		return this;
	}

	addTextArea(cb: (text: any) => any): this {
		cb({
			setPlaceholder: (_text: string) => ({
				setValue: (_value: string) => ({ onChange: (_cb: (value: string) => void) => {} }),
			}),
			setValue: (_value: string) => ({
				onChange: (_cb: (value: string) => void) => {},
			}),
			onChange: (_cb: (value: string) => void) => {},
			inputEl: { rows: 10, cols: 50 },
		});
		return this;
	}

	addDropdown(cb: (dropdown: any) => any): this {
		cb({
			addOption: (_value: string, _display: string) => ({
				setValue: (_selected: string) => ({ onChange: (_cb: (value: string) => void) => {} }),
			}),
			setValue: (_value: string) => ({
				onChange: (_cb: (value: string) => void) => {},
			}),
			onChange: (_cb: (value: string) => void) => {},
		});
		return this;
	}
}

export class Modal {
	public contentEl: HTMLElement;
	public titleEl: HTMLElement;

	constructor(public app: any) {
		this.contentEl = document.createElement('div');
		this.titleEl = document.createElement('div');
	}

	open(): void {
		// Mock implementation
	}

	close(): void {
		// Mock implementation
	}

	onOpen(): void {
		// Override in subclass
	}

	onClose(): void {
		// Override in subclass
	}
}

export class ItemView {
	public contentEl: HTMLElement;
	public containerEl: HTMLElement;

	constructor(public leaf: any) {
		this.contentEl = document.createElement('div');
		this.containerEl = document.createElement('div');
	}

	getViewType(): string {
		return 'view';
	}

	getDisplayText(): string {
		return 'View';
	}

	getIcon(): string {
		return 'document';
	}

	onOpen(): Promise<void> {
		return Promise.resolve();
	}

	onClose(): Promise<void> {
		return Promise.resolve();
	}
}

export class TFile {
	constructor(public path: string = '') {}

	get name(): string {
		return this.path.split('/').pop() || '';
	}

	get basename(): string {
		return this.name.replace(/\.[^/.]+$/, '');
	}

	get extension(): string {
		const match = this.name.match(/\.([^/.]+)$/);
		return match ? match[1] : '';
	}
}

export class App {
	workspace: any;
	vault: any;

	constructor() {
		this.workspace = {
			getLeavesOfType: jest.fn().mockReturnValue([]),
			getRightLeaf: jest.fn().mockReturnValue({ setViewState: jest.fn() }),
			revealLeaf: jest.fn(),
			getLeaf: jest.fn().mockReturnValue({ openFile: jest.fn() }),
			trigger: jest.fn(),
		};

		this.vault = {
			getAbstractFileByPath: jest.fn().mockReturnValue(null),
			create: jest
				.fn()
				.mockImplementation((path: string, _content: string) => Promise.resolve(new TFile(path))),
			delete: jest.fn().mockResolvedValue(undefined),
		};
	}
}

export class WorkspaceLeaf {
	public view: any;

	constructor() {
		this.view = null;
	}

	setViewState(_state: any): Promise<void> {
		return Promise.resolve();
	}

	openFile(_file: TFile): Promise<void> {
		return Promise.resolve();
	}
}
