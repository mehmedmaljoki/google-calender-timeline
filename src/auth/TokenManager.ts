import { Plugin } from 'obsidian';
import { OAuthToken } from '../types/calendar';

/**
 * Secure Token Manager
 * Handles storage and retrieval of OAuth tokens using Obsidian's secure storage
 */
export class TokenManager {
	private readonly TOKEN_KEY = 'google-calendar-oauth-token';
	private plugin: Plugin;
	private cachedToken: OAuthToken | null = null;

	constructor(plugin: Plugin) {
		this.plugin = plugin;
	}

	/**
	 * Save OAuth token securely
	 */
	async saveToken(token: OAuthToken): Promise<void> {
		try {
			// Calculate expiration time if not provided
			if (!token.expires_at && token.expires_in) {
				token.expires_at = Date.now() + token.expires_in * 1000;
			}

			// Store in plugin data (encrypted by Obsidian)
			const data = (await this.plugin.loadData()) || {};
			data[this.TOKEN_KEY] = token;
			await this.plugin.saveData(data);

			// Update cache
			this.cachedToken = token;
		} catch (error) {
			console.error('Failed to save token:', error);
			throw new Error('Failed to save authentication token');
		}
	}

	/**
	 * Retrieve stored OAuth token
	 */
	async getToken(): Promise<OAuthToken | null> {
		try {
			// Return cached token if available and not expired
			if (this.cachedToken && !this.isTokenExpired(this.cachedToken)) {
				return this.cachedToken;
			}

			// Load from storage
			const data = await this.plugin.loadData();
			const token = data?.[this.TOKEN_KEY];

			if (token) {
				this.cachedToken = token;
				return token;
			}

			return null;
		} catch (error) {
			console.error('Failed to retrieve token:', error);
			return null;
		}
	}

	/**
	 * Synchronously get token (from cache only)
	 */
	getTokenSync(): OAuthToken | null {
		return this.cachedToken;
	}

	/**
	 * Clear stored token
	 */
	async clearToken(): Promise<void> {
		try {
			const data = (await this.plugin.loadData()) || {};
			delete data[this.TOKEN_KEY];
			await this.plugin.saveData(data);

			// Clear cache
			this.cachedToken = null;
		} catch (error) {
			console.error('Failed to clear token:', error);
			throw new Error('Failed to clear authentication token');
		}
	}

	/**
	 * Check if token is expired
	 */
	isTokenExpired(token: OAuthToken): boolean {
		if (!token.expires_at) {
			// If no expiration time, consider it expired
			return true;
		}

		// Add 5 minute buffer to refresh before actual expiration
		const bufferMs = 5 * 60 * 1000;
		return Date.now() >= token.expires_at - bufferMs;
	}

	/**
	 * Check if token will expire soon
	 */
	isTokenExpiringSoon(token: OAuthToken, minutesThreshold: number = 10): boolean {
		if (!token.expires_at) {
			return true;
		}

		const thresholdMs = minutesThreshold * 60 * 1000;
		return Date.now() >= token.expires_at - thresholdMs;
	}

	/**
	 * Get token expiration time
	 */
	getTokenExpirationTime(token: OAuthToken): Date | null {
		if (!token.expires_at) {
			return null;
		}
		return new Date(token.expires_at);
	}

	/**
	 * Get remaining token lifetime in seconds
	 */
	getTokenRemainingLifetime(token: OAuthToken): number {
		if (!token.expires_at) {
			return 0;
		}

		const remainingMs = token.expires_at - Date.now();
		return Math.max(0, Math.floor(remainingMs / 1000));
	}

	/**
	 * Validate token structure
	 */
	isValidToken(token: unknown): token is OAuthToken {
		if (!token || typeof token !== 'object') {
			return false;
		}
		const candidate = token as OAuthToken;
		return (
			typeof candidate.access_token === 'string' &&
			candidate.access_token.length > 0 &&
			typeof candidate.token_type === 'string' &&
			candidate.token_type.length > 0 &&
			typeof candidate.refresh_token === 'string'
		);
	}

	/**
	 * Initialize token manager (load token into cache)
	 */
	async initialize(): Promise<void> {
		await this.getToken();
	}
}
