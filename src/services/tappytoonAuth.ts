export interface AuthUser {
  id?: number;
  email: string;
  nickname?: string;
}

export interface AuthTokenResponse {
  access_token: string;
  token_type: string;
  refresh_token?: string;
  expires_in?: number;
  user?: AuthUser;
}

const CLIENT_ID = 'Vs2VRP7u2UaKZSMh40n0nUcRuLwKi3FVi3wi82OWY6PedGcj9CGF504NKa3dE0RJqp3mXNvz1vBW0hft';
const CLIENT_SECRET = 'MskpBP393OVvlb4dNQo5w3D9wSLo2qaDy2Gholkz4KYrGgqF9EIMtCo4U0GVTGIxao5rPF2vKEmu59tg';
const TOKEN_URL = 'https://api-global.tappytoon.com/oauth/token';

const STORAGE_KEY_TOKEN = 'tappytoon_access_token';
const STORAGE_KEY_REFRESH = 'tappytoon_refresh_token';
const STORAGE_KEY_USER = 'tappytoon_user_data';

export class TappytoonAuthService {
  /**
   * Log in to Tappytoon using email and password.
   * Never stores the password in localStorage or memory beyond the HTTP request.
   */
  static async login(username: string, password: string): Promise<AuthTokenResponse> {
    const trimmedUsername = username.trim();
    if (!trimmedUsername || !password) {
      throw new Error('Please enter both email and password.');
    }

    const payload = {
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      grantType: 'password',
      username: trimmedUsername,
      password: password,
      role: 'user',
    };

    let response: Response;
    try {
      response = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Network error during authentication: ${msg}`);
    }

    if (!response.ok) {
      let errorMsg = `Authentication failed (Status ${response.status})`;
      try {
        const errorData = await response.json();
        if (errorData?.message) {
          errorMsg = errorData.message;
        }
      } catch {
        // Fallback to generic status message
      }
      throw new Error(errorMsg);
    }

    const data: AuthTokenResponse = await response.json();
    if (!data.access_token) {
      throw new Error('Invalid authentication response received from Tappytoon.');
    }

    this.saveSession(data, trimmedUsername);
    return data;
  }

  /**
   * Save access token, refresh token, and user info to localStorage.
   */
  private static saveSession(data: AuthTokenResponse, fallbackEmail: string): void {
    if (typeof window === 'undefined' || !window.localStorage) return;

    localStorage.setItem(STORAGE_KEY_TOKEN, data.access_token);

    if (data.refresh_token) {
      localStorage.setItem(STORAGE_KEY_REFRESH, data.refresh_token);
    }

    const user: AuthUser = {
      id: data.user?.id,
      email: data.user?.email || fallbackEmail,
      nickname: data.user?.nickname || data.user?.email || fallbackEmail,
    };
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
  }

  /**
   * Set explicit access token manually if provided.
   */
  static setExplicitToken(accessToken: string, email = 'User Session'): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    localStorage.setItem(STORAGE_KEY_TOKEN, accessToken);
    const user: AuthUser = { email, nickname: email };
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
  }

  /**
   * Get the saved access token.
   */
  static getAccessToken(): string | null {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return localStorage.getItem(STORAGE_KEY_TOKEN);
  }

  /**
   * Get the saved refresh token.
   */
  static getRefreshToken(): string | null {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return localStorage.getItem(STORAGE_KEY_REFRESH);
  }

  /**
   * Get current user profile if logged in.
   */
  static getUser(): AuthUser | null {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const raw = localStorage.getItem(STORAGE_KEY_USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }

  /**
   * Check if user is logged in.
   */
  static isLoggedIn(): boolean {
    return Boolean(this.getAccessToken());
  }

  /**
   * Log out and clear stored tokens and profile data.
   */
  static logout(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_REFRESH);
    localStorage.removeItem(STORAGE_KEY_USER);
  }
}
