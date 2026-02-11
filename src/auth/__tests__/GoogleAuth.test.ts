/**
 * GoogleAuth Tests
 */

import { createMockToken, createMockTokenManager } from '../../__mocks__/factories';
import { AuthenticationError, OAuthToken } from '../../types/calendar';
import { GoogleAuth } from '../GoogleAuth';
import { TokenManager } from '../TokenManager';

// Mock Obsidian
jest.mock('obsidian');

// Mock fetch
global.fetch = jest.fn();

describe('GoogleAuth', () => {
	let auth: GoogleAuth;
	let mockTokenManager: jest.Mocked<TokenManager>;
	let consoleErrorSpy: jest.SpyInstance;

	beforeEach(() => {
		consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
		mockTokenManager = createMockTokenManager() as unknown as jest.Mocked<TokenManager>;
		auth = new GoogleAuth(mockTokenManager);
		jest.clearAllMocks();
	});

	afterEach(() => {
		consoleErrorSpy.mockRestore();
	});

	describe('isAuthenticated', () => {
		it('should return true when token exists', () => {
			// Arrange
			mockTokenManager.getTokenSync.mockReturnValue(createMockToken());

			// Act
			const isAuth = auth.isAuthenticated();

			// Assert
			expect(isAuth).toBe(true);
		});

		it('should return false when no token exists', () => {
			// Arrange
			mockTokenManager.getTokenSync.mockReturnValue(null);

			// Act
			const isAuth = auth.isAuthenticated();

			// Assert
			expect(isAuth).toBe(false);
		});
	});

	describe('getAccessToken', () => {
		it('should return valid access token', async () => {
			// Arrange
			const token = createMockToken({ expires_at: Date.now() + 3600000 });
			mockTokenManager.getToken.mockResolvedValue(token);
			mockTokenManager.isTokenExpired.mockReturnValue(false);

			// Act
			const accessToken = await auth.getAccessToken();

			// Assert
			expect(accessToken).toBe(token.access_token);
		});

		it('should throw error if not authenticated', async () => {
			// Arrange
			mockTokenManager.getToken.mockResolvedValue(null);

			// Act & Assert
			await expect(auth.getAccessToken()).rejects.toThrow(AuthenticationError);
			await expect(auth.getAccessToken()).rejects.toThrow('Not authenticated');
		});

		it('should refresh token if expired', async () => {
			// Arrange
			const expiredToken = createMockToken({ expires_at: Date.now() - 1000 });
			const newToken = createMockToken({ access_token: 'new_token' });

			mockTokenManager.getToken.mockResolvedValue(expiredToken);
			mockTokenManager.isTokenExpired.mockReturnValue(true);

			(global.fetch as jest.Mock).mockResolvedValue({
				ok: true,
				json: async () => ({
					access_token: newToken.access_token,
					expires_in: 3600,
				}),
			});

			// Act
			const accessToken = await auth.getAccessToken();

			// Assert
			expect(accessToken).toBe(newToken.access_token);
			expect(mockTokenManager.saveToken).toHaveBeenCalled();
		});
	});

	describe('refreshToken', () => {
		it('should refresh access token', async () => {
			// Arrange
			const oldToken = createMockToken();
			mockTokenManager.getToken.mockResolvedValue(oldToken);

			(global.fetch as jest.Mock).mockResolvedValue({
				ok: true,
				json: async () => ({
					access_token: 'new_access_token',
					expires_in: 3600,
				}),
			});

			// Act
			const newAccessToken = await auth.refreshToken();

			// Assert
			expect(newAccessToken).toBe('new_access_token');
			expect(mockTokenManager.saveToken).toHaveBeenCalledWith(
				expect.objectContaining({
					access_token: 'new_access_token',
					refresh_token: oldToken.refresh_token,
				})
			);
		});

		it('should throw error if no refresh token available', async () => {
			// Arrange
			mockTokenManager.getToken.mockResolvedValue(null);

			// Act & Assert
			await expect(auth.refreshToken()).rejects.toThrow(AuthenticationError);
			await expect(auth.refreshToken()).rejects.toThrow('No refresh token available');
		});

		it('should throw error if refresh fails', async () => {
			// Arrange
			const token = createMockToken();
			mockTokenManager.getToken.mockResolvedValue(token);

			(global.fetch as jest.Mock).mockResolvedValue({
				ok: false,
				status: 400,
			});

			// Act & Assert
			await expect(auth.refreshToken()).rejects.toThrow(AuthenticationError);
		});
	});

	describe('logout', () => {
		it('should clear stored token', async () => {
			// Act
			await auth.logout();

			// Assert
			expect(mockTokenManager.clearToken).toHaveBeenCalled();
		});
	});

	describe('revokeToken', () => {
		it('should revoke token on Google and clear locally', async () => {
			// Arrange
			const token = createMockToken();
			mockTokenManager.getToken.mockResolvedValue(token);

			(global.fetch as jest.Mock).mockResolvedValue({
				ok: true,
			});

			// Act
			await auth.revokeToken();

			// Assert
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('revoke'),
				expect.any(Object)
			);
			expect(mockTokenManager.clearToken).toHaveBeenCalled();
		});

		it('should clear token even if revoke fails', async () => {
			// Arrange
			const token = createMockToken();
			mockTokenManager.getToken.mockResolvedValue(token);

			(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

			// Act
			await auth.revokeToken();

			// Assert
			expect(mockTokenManager.clearToken).toHaveBeenCalled();
		});

		it('should do nothing if no token exists', async () => {
			// Arrange
			mockTokenManager.getToken.mockResolvedValue(null);

			// Act
			await auth.revokeToken();

			// Assert
			expect(global.fetch).not.toHaveBeenCalled();
		});
	});

	describe('login', () => {
		it('should complete login flow and close the window', async () => {
			const closeMock = jest.fn();
			const openSpy = jest
				.spyOn(window, 'open')
				.mockReturnValue({ closed: false, close: closeMock } as unknown as Window);

			const authInternal = auth as unknown as {
				buildAuthUrl: () => string;
				waitForAuthCode: () => Promise<string>;
				exchangeCodeForToken: (code: string) => Promise<OAuthToken>;
			};

			const buildSpy = jest.spyOn(authInternal, 'buildAuthUrl').mockReturnValue('http://test');
			const waitSpy = jest.spyOn(authInternal, 'waitForAuthCode').mockResolvedValue('code');
			const exchangeSpy = jest
				.spyOn(authInternal, 'exchangeCodeForToken')
				.mockResolvedValue(createMockToken());

			await auth.login();

			expect(mockTokenManager.saveToken).toHaveBeenCalled();
			expect(closeMock).toHaveBeenCalled();

			buildSpy.mockRestore();
			waitSpy.mockRestore();
			exchangeSpy.mockRestore();
			openSpy.mockRestore();
		});

		it('should close the window on login failure', async () => {
			const closeMock = jest.fn();
			const openSpy = jest
				.spyOn(window, 'open')
				.mockReturnValue({ closed: false, close: closeMock } as unknown as Window);

			const authInternal = auth as unknown as {
				buildAuthUrl: () => string;
				waitForAuthCode: () => Promise<string>;
			};

			const buildSpy = jest.spyOn(authInternal, 'buildAuthUrl').mockReturnValue('http://test');
			const waitSpy = jest
				.spyOn(authInternal, 'waitForAuthCode')
				.mockRejectedValue(new Error('No code'));

			await expect(auth.login()).rejects.toThrow(AuthenticationError);
			expect(closeMock).toHaveBeenCalled();

			buildSpy.mockRestore();
			waitSpy.mockRestore();
			openSpy.mockRestore();
		});
	});
});
