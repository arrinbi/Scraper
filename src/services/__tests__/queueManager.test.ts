import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QueueManager } from '../queueManager';
import * as db from '../db';
import { QueueItemRecord } from '../db';

vi.mock('../db', () => {
  const store: Record<string, QueueItemRecord> = {};
  return {
    saveQueueItem: vi.fn(async (item: QueueItemRecord) => {
      store[item.id] = item;
    }),
    getQueueItemByCanonical: vi.fn(async (canonicalUrl: string) => store[canonicalUrl]),
    getAllQueueItems: vi.fn(async () => Object.values(store)),
    deleteQueueItem: vi.fn(async (id: string) => {
      delete store[id];
    }),
    saveItemImages: vi.fn(async () => {}),
  };
});

// Mock TappytoonAdapter to prevent processing from running in background during test
vi.mock('../tappytoonAdapter', () => ({
  TappytoonAdapter: {
    fetchMetadata: vi.fn(async () => ({
      seriesTitle: 'Solo Leveling',
      episodeTitle: 'Episode 1',
      accessStatus: 'public',
      accessMessage: 'Public',
    })),
    extractImages: vi.fn(async () => {
      throw new Error('Prevent extraction during unit test');
    }),
  },
}));

describe('QueueManager service', () => {
  let queueManager: QueueManager;

  beforeEach(() => {
    vi.clearAllMocks();
    queueManager = QueueManager.getInstance();
  });

  it('adds a valid episode to queue', async () => {
    const item = await queueManager.addToQueue('https://www.tappytoon.com/en/comics/solo-leveling/1');
    expect(item).toBeDefined();
    expect(item.seriesTitle).toBe('Solo Leveling');
    expect(item.status).toBe('Waiting');
    expect(db.saveQueueItem).toHaveBeenCalled();
  });

  it('prevents adding duplicate episode to queue', async () => {
    await queueManager.addToQueue('https://www.tappytoon.com/en/comics/solo-leveling/10');
    await expect(
      queueManager.addToQueue('https://www.tappytoon.com/en/comics/solo-leveling/10')
    ).rejects.toThrow('already in the queue');
  });

  it('allows removing an item from queue', async () => {
    const item = await queueManager.addToQueue('https://www.tappytoon.com/en/comics/solo-leveling/2');
    await queueManager.removeItem(item.id);
    expect(db.deleteQueueItem).toHaveBeenCalledWith(item.id);
  });
});
