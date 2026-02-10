let consoleLogSpy: jest.SpyInstance | null = null;

beforeAll(() => {
	consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
});

afterAll(() => {
	consoleLogSpy?.mockRestore();
	consoleLogSpy = null;
});
