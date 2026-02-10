import { Notice } from 'obsidian';
import { AuthenticationError, IAuth, OAuthToken } from '../types/calendar';
import { TokenManager } from './TokenManager';

/**
 * Google OAuth 2.0 Authentication Handler
 * Manages the complete OAuth flow for Google Calendar API access
 */
export class GoogleAuth implements IAuth {
	private tokenManager: TokenManager;
	private authWindow: Window | null = null;

	// OAuth Configuration
	private readonly AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
	private readonly TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
	private readonly REDIRECT_URI = 'http://localhost:42813/callback';

	// These should be replaced with your actual client credentials
	// For production, consider using environment variables or secure storage
	private readonly CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_CLIENT_ID';
	private readonly CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'YOUR_CLIENT_SECRET';

	private readonly SCOPES = [
		'https://www.googleapis.com/auth/calendar.readonly',
		'https://www.googleapis.com/auth/calendar.events',
	];

	constructor(tokenManager: TokenManager) {
		this.tokenManager = tokenManager;
	}

	/**
	 * Initiate the OAuth login flow
	 */
	async login(): Promise<void> {
		try {
			new Notice('Opening Google authentication...');

			const authUrl = this.buildAuthUrl();

			// Open authentication window
			this.authWindow = window.open(
				authUrl,
				'Google Authentication',
				'width=600,height=700,menubar=no,toolbar=no'
			);

			// Start local server to handle OAuth callback
			const authCode = await this.waitForAuthCode();

			// Exchange code for tokens
			const token = await this.exchangeCodeForToken(authCode);

			// Save token
			await this.tokenManager.saveToken(token);

			new Notice('Successfully authenticated with Google Calendar!');
		} catch (error) {
			console.error('Authentication error:', error);
			new Notice('Failed to authenticate with Google Calendar');
			throw new AuthenticationError(
				error instanceof Error ? error.message : 'Authentication failed'
			);
		} finally {
			if (this.authWindow && !this.authWindow.closed) {
				this.authWindow.close();
			}
		}
	}

	/**
	 * Logout and clear stored tokens
	 */
	async logout(): Promise<void> {
		await this.tokenManager.clearToken();
		new Notice('Logged out from Google Calendar');
	}

	/**
	 * Get current access token, refreshing if necessary
	 */
	async getAccessToken(): Promise<string> {
		const token = await this.tokenManager.getToken();

		if (!token) {
			throw new AuthenticationError('Not authenticated. Please login first.');
		}

		// Check if token is expired
		if (this.tokenManager.isTokenExpired(token)) {
			// Refresh the token
			const newToken = await this.refreshToken();
			return newToken;
		}

		return token.access_token;
	}

	/**
	 * Refresh the access token using refresh token
	 */
	async refreshToken(): Promise<string> {
		const token = await this.tokenManager.getToken();

		if (!token?.refresh_token) {
			throw new AuthenticationError('No refresh token available. Please login again.');
		}

		try {
			const response = await fetch(this.TOKEN_ENDPOINT, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: new URLSearchParams({
					client_id: this.CLIENT_ID,
					client_secret: this.CLIENT_SECRET,
					refresh_token: token.refresh_token,
					grant_type: 'refresh_token',
				}),
			});

			if (!response.ok) {
				throw new AuthenticationError('Failed to refresh token');
			}

			const data = await response.json();

			// Update token with new access token
			const updatedToken: OAuthToken = {
				...token,
				access_token: data.access_token,
				expires_in: data.expires_in,
				expires_at: Date.now() + data.expires_in * 1000,
			};

			await this.tokenManager.saveToken(updatedToken);

			return updatedToken.access_token;
		} catch (error) {
			console.error('Token refresh error:', error);
			throw new AuthenticationError('Failed to refresh token');
		}
	}

	/**
	 * Check if user is authenticated
	 */
	isAuthenticated(): boolean {
		const token = this.tokenManager.getTokenSync();
		return !!token;
	}

	/**
	 * Build the OAuth authorization URL
	 */
	private buildAuthUrl(): string {
		const params = new URLSearchParams({
			client_id: this.CLIENT_ID,
			redirect_uri: this.REDIRECT_URI,
			response_type: 'code',
			scope: this.SCOPES.join(' '),
			access_type: 'offline',
			prompt: 'consent',
			state: this.generateState(),
		});

		return `${this.AUTH_ENDPOINT}?${params.toString()}`;
	}

	/**
	 * Wait for OAuth callback with authorization code
	 */
	private async waitForAuthCode(): Promise<string> {
		return new Promise((resolve, reject) => {
			// Create a temporary HTTP server to handle the callback
			// This is a simplified implementation
			// In production, you'd want a proper local server

			const checkInterval = setInterval(() => {
				if (this.authWindow?.closed) {
					clearInterval(checkInterval);
					reject(new Error('Authentication window was closed'));
				}
			}, 1000);

			// Listen for message from auth window
			const messageHandler = (event: MessageEvent) => {
				if (event.origin !== window.location.origin) return;

				if (event.data.type === 'oauth-callback') {
					clearInterval(checkInterval);
					window.removeEventListener('message', messageHandler);

					if (event.data.code) {
						resolve(event.data.code);
					} else {
						reject(new Error(event.data.error || 'Authorization failed'));
					}
				}
			};

			window.addEventListener('message', messageHandler);

			// Timeout after 5 minutes
			setTimeout(
				() => {
					clearInterval(checkInterval);
					window.removeEventListener('message', messageHandler);
					reject(new Error('Authentication timeout'));
				},
				5 * 60 * 1000
			);
		});
	}

	/**
	 * Exchange authorization code for access token
	 */
	private async exchangeCodeForToken(code: string): Promise<OAuthToken> {
		const response = await fetch(this.TOKEN_ENDPOINT, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: new URLSearchParams({
				client_id: this.CLIENT_ID,
				client_secret: this.CLIENT_SECRET,
				code: code,
				redirect_uri: this.REDIRECT_URI,
				grant_type: 'authorization_code',
			}),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new AuthenticationError(
				`Token exchange failed: ${error.error_description || error.error}`
			);
		}

		const data = await response.json();

		return {
			access_token: data.access_token,
			refresh_token: data.refresh_token,
			token_type: data.token_type,
			expires_in: data.expires_in,
			expires_at: Date.now() + data.expires_in * 1000,
			scope: data.scope,
		};
	}

	/**
	 * Generate a random state for CSRF protection
	 */
	private generateState(): string {
		return (
			Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
		);
	}

	/**
	 * Revoke token (logout from Google)
	 */
	async revokeToken(): Promise<void> {
		const token = await this.tokenManager.getToken();
		if (!token) return;

		try {
			await fetch(`https://oauth2.googleapis.com/revoke?token=${token.access_token}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
			});
		} catch (error) {
			console.error('Failed to revoke token:', error);
			// Continue with local logout even if revoke fails
		}

		await this.logout();
	}
}
