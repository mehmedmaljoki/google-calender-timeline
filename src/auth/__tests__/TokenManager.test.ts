/**
 * TokenManager Tests
 */

import { Plugin } from 'obsidian';
import { createMockPlugin, createMockToken } from '../../__mocks__/factories';
import { TokenManager } from '../TokenManager';

// Mock Obsidian
jest.mock('obsidian');

describe('TokenManager', () => {
	let tokenManager: TokenManager;
	let mockPlugin: Plugin;

	beforeEach(() => {
		mockPlugin = createMockPlugin() as unknown as Plugin;
		tokenManager = new TokenManager(mockPlugin);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('saveToken', () => {
		it('should save token to plugin data', async () => {
			// Arrange
			const token = createMockToken();

			// Act
			await tokenManager.saveToken(token);

			// Assert
			expect(mockPlugin.saveData).toHaveBeenCalledWith(
				expect.objectContaining({
					'google-calendar-oauth-token': expect.objectContaining({
						access_token: token.access_token,
						refresh_token: token.refresh_token,
					}),
				})
			);
		});

		it('should calculate expires_at if not provided', async () => {
			// Arrange
			const token = createMockToken({ expires_at: undefined });
			const beforeTime = Date.now();

			// Act
			await tokenManager.saveToken(token);

			// Assert
			expect(mockPlugin.saveData).toHaveBeenCalled();
			const savedData = (mockPlugin.saveData as jest.Mock).mock.calls[0][0];
			const savedToken = savedData['google-calendar-oauth-token'];
			expect(savedToken.expires_at).toBeGreaterThanOrEqual(beforeTime + token.expires_in * 1000);
		});

		it('should update cached token', async () => {
			// Arrange
			const token = createMockToken();

			// Act
			await tokenManager.saveToken(token);
			const cachedToken = tokenManager.getTokenSync();

			// Assert
			expect(cachedToken).toEqual(expect.objectContaining(token));
		});
	});

	describe('getToken', () => {
		it('should return cached token if available and not expired', async () => {
			// Arrange
			const token = createMockToken({ expires_at: Date.now() + 3600000 });
			await tokenManager.saveToken(token);

			// Act
			const retrievedToken = await tokenManager.getToken();

			// Assert
			expect(retrievedToken).toEqual(expect.objectContaining(token));
			expect(mockPlugin.loadData).toHaveBeenCalledTimes(1); // Only once during save
		});

		it('should load from storage if cache is empty', async () => {
			// Arrange
			const token = createMockToken();
			(mockPlugin.loadData as jest.Mock).mockResolvedValue({
				'google-calendar-oauth-token': token,
			});

			// Act
			const retrievedToken = await tokenManager.getToken();

			// Assert
			expect(mockPlugin.loadData).toHaveBeenCalled();
			expect(retrievedToken).toEqual(expect.objectContaining(token));
		});

		it('should return null if no token exists', async () => {
			// Arrange
			(mockPlugin.loadData as jest.Mock).mockResolvedValue({});

			// Act
			const retrievedToken = await tokenManager.getToken();

			// Assert
			expect(retrievedToken).toBeNull();
		});
	});

	describe('clearToken', () => {
		it('should delete token from storage', async () => {
			// Arrange
			const token = createMockToken();
			await tokenManager.saveToken(token);

			// Act
			await tokenManager.clearToken();

			// Assert
			expect(mockPlugin.saveData).toHaveBeenCalledWith({});
		});

		it('should clear cached token', async () => {
			// Arrange
			const token = createMockToken();
			await tokenManager.saveToken(token);

			// Act
			await tokenManager.clearToken();

			// Assert
			expect(tokenManager.getTokenSync()).toBeNull();
		});
	});

	describe('isTokenExpired', () => {
		it('should return false for valid token', () => {
			// Arrange
			const token = createMockToken({ expires_at: Date.now() + 3600000 });

			// Act
			const isExpired = tokenManager.isTokenExpired(token);

			// Assert
			expect(isExpired).toBe(false);
		});

		it('should return true for expired token', () => {
			// Arrange
			const token = createMockToken({ expires_at: Date.now() - 1000 });

			// Act
			const isExpired = tokenManager.isTokenExpired(token);

			// Assert
			expect(isExpired).toBe(true);
		});

		it('should return true if expires_at is missing', () => {
			// Arrange
			const token = createMockToken({ expires_at: undefined });

			// Act
			const isExpired = tokenManager.isTokenExpired(token);

			// Assert
			expect(isExpired).toBe(true);
		});

		it('should consider token expired within 5 minute buffer', () => {
			// Arrange
			const token = createMockToken({ expires_at: Date.now() + 4 * 60 * 1000 }); // 4 minutes

			// Act
			const isExpired = tokenManager.isTokenExpired(token);

			// Assert
			expect(isExpired).toBe(true);
		});
	});

	describe('isTokenExpiringSoon', () => {
		it('should return false if token has plenty of time', () => {
			// Arrange
			const token = createMockToken({ expires_at: Date.now() + 3600000 }); // 1 hour

			// Act
			const isExpiringSoon = tokenManager.isTokenExpiringSoon(token, 10);

			// Assert
			expect(isExpiringSoon).toBe(false);
		});

		it('should return true if token expires within threshold', () => {
			// Arrange
			const token = createMockToken({ expires_at: Date.now() + 5 * 60 * 1000 }); // 5 minutes

			// Act
			const isExpiringSoon = tokenManager.isTokenExpiringSoon(token, 10); // 10 minute threshold

			// Assert
			expect(isExpiringSoon).toBe(true);
		});
	});

	describe('getTokenExpirationTime', () => {
		it('should return expiration date', () => {
			// Arrange
			const expiresAt = Date.now() + 3600000;
			const token = createMockToken({ expires_at: expiresAt });

			// Act
			const expirationTime = tokenManager.getTokenExpirationTime(token);

			// Assert
			expect(expirationTime).toEqual(new Date(expiresAt));
		});

		it('should return null if expires_at is missing', () => {
			// Arrange
			const token = createMockToken({ expires_at: undefined });

			// Act
			const expirationTime = tokenManager.getTokenExpirationTime(token);

			// Assert
			expect(expirationTime).toBeNull();
		});
	});

	describe('getTokenRemainingLifetime', () => {
		it('should return remaining seconds', () => {
			// Arrange
			const token = createMockToken({ expires_at: Date.now() + 3600000 }); // 1 hour

			// Act
			const remaining = tokenManager.getTokenRemainingLifetime(token);

			// Assert
			expect(remaining).toBeGreaterThan(3590); // ~3600 with some tolerance
			expect(remaining).toBeLessThanOrEqual(3600);
		});

		it('should return 0 for expired token', () => {
			// Arrange
			const token = createMockToken({ expires_at: Date.now() - 1000 });

			// Act
			const remaining = tokenManager.getTokenRemainingLifetime(token);

			// Assert
			expect(remaining).toBe(0);
		});
	});

	describe('isValidToken', () => {
		it('should return true for valid token', () => {
			// Arrange
			const token = createMockToken();

			// Act
			const isValid = tokenManager.isValidToken(token);

			// Assert
			expect(isValid).toBe(true);
		});

		it('should return false if access_token is missing', () => {
			// Arrange
			const token = { ...createMockToken(), access_token: '' };

			// Act
			const isValid = tokenManager.isValidToken(token);

			// Assert
			expect(isValid).toBe(false);
		});

		it('should return false if token_type is missing', () => {
			// Arrange
			const token = { ...createMockToken(), token_type: '' as any };

			// Act
			const isValid = tokenManager.isValidToken(token);

			// Assert
			expect(isValid).toBe(false);
		});

		it('should return false for null', () => {
			// Act
			const isValid = tokenManager.isValidToken(null);

			// Assert
			expect(isValid).toBe(false);
		});
	});
});
