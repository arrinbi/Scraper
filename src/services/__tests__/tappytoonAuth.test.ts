import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TappytoonAuthService } from '../tappytoonAuth';

describe('TappytoonAuthService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('should save token and user profile on successful login', async () => {
    const mockResponse = {
      access_token: 'mock_access_token_123',
      token_type: 'Bearer',
      refresh_token: 'mock_refresh_token_456',
      user: { id: 1, email: 'test@example.com', nickname: 'TestUser' },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const res = await TappytoonAuthService.login('test@example.com', 'password123');

    expect(res.access_token).toBe('mock_access_token_123');
    expect(TappytoonAuthService.isLoggedIn()).toBe(true);
    expect(TappytoonAuthService.getAccessToken()).toBe('mock_access_token_123');
    expect(TappytoonAuthService.getRefreshToken()).toBe('mock_refresh_token_456');
    expect(TappytoonAuthService.getUser()).toEqual({
      id: 1,
      email: 'test@example.com',
      nickname: 'TestUser',
    });
  });

  it('should throw error when login fails with error message', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ message: 'No account found with this email' }),
    } as Response);

    await expect(TappytoonAuthService.login('unknown@example.com', 'wrongpass')).rejects.toThrow(
      'No account found with this email'
    );
    expect(TappytoonAuthService.isLoggedIn()).toBe(false);
  });

  it('should handle setExplicitToken and logout correctly', () => {
    TappytoonAuthService.setExplicitToken('explicit_token_xyz', 'custom@example.com');
    expect(TappytoonAuthService.isLoggedIn()).toBe(true);
    expect(TappytoonAuthService.getAccessToken()).toBe('explicit_token_xyz');

    TappytoonAuthService.logout();
    expect(TappytoonAuthService.isLoggedIn()).toBe(false);
    expect(TappytoonAuthService.getAccessToken()).toBeNull();
    expect(TappytoonAuthService.getUser()).toBeNull();
  });
});
