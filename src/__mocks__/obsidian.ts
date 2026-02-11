/**
 * Mock for Obsidian API
 */

type ButtonComponent = {
	setButtonText: (text: string) => ButtonComponent;
	setCta: () => ButtonComponent;
	onClick: (cb: () => void) => void;
};

type ToggleComponent = {
	setValue: (value: boolean) => ToggleComponent;
	onChange: (cb: (value: boolean) => void) => void;
};

type TextComponent = {
	setPlaceholder: (text: string) => TextComponent;
	setValue: (value: string) => TextComponent;
	onChange: (cb: (value: string) => void) => void;
};

type TextAreaComponent = TextComponent & {
	inputEl: { rows: number; cols: number };
};

type DropdownComponent = {
	addOption: (value: string, display: string) => DropdownComponent;
	setValue: (value: string) => DropdownComponent;
	onChange: (cb: (value: string) => void) => void;
};

export const __testUtils = {
	buttonClicks: [] as Array<() => void>,
	toggleChanges: [] as Array<(value: boolean) => void>,
	textChanges: [] as Array<(value: string) => void>,
	dropdownChanges: [] as Array<(value: string) => void>,
};

type WorkspaceMock = {
	getLeavesOfType: jest.Mock;
	getRightLeaf: jest.Mock;
	revealLeaf: jest.Mock;
	getLeaf: jest.Mock;
	trigger: jest.Mock;
	activeLeaf?: { view?: { containerEl?: HTMLElement } };
};

type VaultMock = {
	getAbstractFileByPath: jest.Mock;
	create: jest.Mock;
	delete: jest.Mock;
};

type FileManagerMock = {
	trashFile: jest.Mock;
};

export class Notice {
	constructor(public message: string) {
		// Mock implementation
	}
}

// Mock requestUrl function
export const requestUrl = jest.fn().mockResolvedValue({
	status: 200,
	headers: {},
	text: '{}',
	json: {},
	arrayBuffer: new ArrayBuffer(0),
});

export class Plugin {
	app: unknown;
	manifest: unknown;

	async loadData(): Promise<Record<string, unknown>> {
		return {};
	}

	async saveData(_data: Record<string, unknown>): Promise<void> {
		// Mock implementation
	}
}

export class PluginSettingTab {
	constructor(
		public app: unknown,
		public plugin: unknown
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

	setHeading(): this {
		return this;
	}

	addButton(cb: (button: ButtonComponent) => void): this {
		const button: ButtonComponent = {
			setButtonText: (_text: string) => button,
			setCta: () => button,
			onClick: (_cb: () => void) => {
				__testUtils.buttonClicks.push(_cb);
			},
		};
		cb(button);
		return this;
	}

	addToggle(cb: (toggle: ToggleComponent) => void): this {
		const toggle: ToggleComponent = {
			setValue: (_value: boolean) => toggle,
			onChange: (_cb: (value: boolean) => void) => {
				__testUtils.toggleChanges.push(_cb);
			},
		};
		cb(toggle);
		return this;
	}

	addText(cb: (text: TextComponent) => void): this {
		const text: TextComponent = {
			setPlaceholder: (_text: string) => text,
			setValue: (_value: string) => text,
			onChange: (_cb: (value: string) => void) => {
				__testUtils.textChanges.push(_cb);
			},
		};
		cb(text);
		return this;
	}

	addTextArea(cb: (text: TextAreaComponent) => void): this {
		const textArea: TextAreaComponent = {
			setPlaceholder: (_text: string) => textArea,
			setValue: (_value: string) => textArea,
			onChange: (_cb: (value: string) => void) => {
				__testUtils.textChanges.push(_cb);
			},
			inputEl: { rows: 10, cols: 50 },
		};
		cb(textArea);
		return this;
	}

	addDropdown(cb: (dropdown: DropdownComponent) => void): this {
		const dropdown: DropdownComponent = {
			addOption: (_value: string, _display: string) => dropdown,
			setValue: (_value: string) => dropdown,
			onChange: (_cb: (value: string) => void) => {
				__testUtils.dropdownChanges.push(_cb);
			},
		};
		cb(dropdown);
		return this;
	}
}

export class Modal {
	public contentEl: HTMLElement;
	public titleEl: HTMLElement;

	constructor(public app: unknown) {
		this.contentEl = document.createElement('div');
		this.titleEl = document.createElement('div');
	}

	open(): void {
		// Mock implementation
	}

	close(): void {
		// Mock implementation
	}

	setTitle(title: string): void {
		this.titleEl.textContent = title;
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

	constructor(public leaf: unknown) {
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
	workspace: WorkspaceMock;
	vault: VaultMock;
	fileManager: FileManagerMock;

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

		this.fileManager = {
			trashFile: jest.fn().mockResolvedValue(undefined),
		};
	}
}

export class WorkspaceLeaf {
	public view: unknown;

	constructor() {
		this.view = null;
	}

	setViewState(_state: unknown): Promise<void> {
		return Promise.resolve();
	}

	openFile(_file: TFile): Promise<void> {
		return Promise.resolve();
	}
}
