import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TappytoonAdapter } from '../tappytoonAdapter';
import { parseTappytoonUrl } from '../tappytoonUrl';

describe('TappytoonAdapter', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should return login_required metadata when API returns 401 Unauthorized', async () => {
    const parsed = parseTappytoonUrl('https://www.tappytoon.com/en/comics/solo-leveling/1');

    global.fetch = vi.fn().mockResolvedValue({
      status: 401,
      ok: false,
    } as Response);

    const metadata = await TappytoonAdapter.fetchMetadata(parsed);
    expect(metadata.accessStatus).toBe('login_required');
    expect(metadata.accessMessage).toContain('Authentication required');
  });

  it('should return purchase_required when user lacks purchase access to episode', async () => {
    const parsed = parseTappytoonUrl('https://www.tappytoon.com/en/comics/solo-leveling/50');

    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('/comics?keyword=')) {
        return { ok: true, status: 200, json: async () => ({ result: [187] }) };
      }
      if (url.includes('/comics/187?')) {
        return { ok: true, status: 200, json: async () => ({ title: 'Solo Leveling' }) };
      }
      if (url.includes('/comics/187/chapters?')) {
        return {
          ok: true,
          status: 200,
          json: async () => [
            { id: 50, title: 'Episode 50', order: 50, isAccessible: false, isFree: false, isUserUnlocked: false },
          ],
        };
      }
      return { ok: false, status: 404 };
    });

    const metadata = await TappytoonAdapter.fetchMetadata(parsed, 'mock_token');
    expect(metadata.accessStatus).toBe('purchase_required');
    expect(metadata.accessMessage).toContain('requires purchase');
  });

  it('should fetch metadata and extract sorted images for an accessible episode', async () => {
    const parsed = parseTappytoonUrl('https://www.tappytoon.com/en/comics/solo-leveling/1');

    const imageBlob1 = new Blob(['image1'], { type: 'image/jpeg' });
    const imageBlob2 = new Blob(['image2'], { type: 'image/jpeg' });

    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('/comics?keyword=')) {
        return { ok: true, status: 200, json: async () => ({ result: [187] }) };
      }
      if (url.includes('/comics/187?')) {
        return { ok: true, status: 200, json: async () => ({ title: 'Solo Leveling' }) };
      }
      if (url.includes('/comics/187/chapters?')) {
        return {
          ok: true,
          status: 200,
          json: async () => [
            { id: 952918436, title: 'Episode 1', order: 1, isAccessible: true, isFree: true, isUserUnlocked: true },
          ],
        };
      }
      if (url.includes('/content-delivery/contents?chapterId=952918436')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            media: [
              { sortKey: 1, path: 'https://cdn.example.com/002.jpg' },
              { sortKey: 0, path: 'https://cdn.example.com/001.jpg' },
            ],
          }),
        };
      }
      if (url.includes('cdn.example.com/001.jpg')) {
        return { ok: true, status: 200, blob: async () => imageBlob1 };
      }
      if (url.includes('cdn.example.com/002.jpg')) {
        return { ok: true, status: 200, blob: async () => imageBlob2 };
      }
      return { ok: false, status: 404 };
    });

    const metadata = await TappytoonAdapter.fetchMetadata(parsed, 'valid_token');
    expect(metadata.accessStatus).toBe('public');
    expect(metadata.estimatedImageCount).toBe(2);
    expect(metadata.imageUrls).toEqual([
      'https://cdn.example.com/001.jpg',
      'https://cdn.example.com/002.jpg',
    ]);

    const result = await TappytoonAdapter.extractImages(parsed, undefined, 'valid_token');
    expect(result.success).toBe(true);
    expect(result.images.length).toBe(2);
    expect(result.images[0].filename).toBe('001.jpg');
    expect(result.images[1].filename).toBe('002.jpg');
  });
});
