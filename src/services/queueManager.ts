import { parseTappytoonUrl } from './tappytoonUrl';
import { TappytoonAdapter } from './tappytoonAdapter';
import { TappytoonAuthService } from './tappytoonAuth';
import {
  QueueItemRecord,
  saveQueueItem,
  getAllQueueItems,
  getQueueItemByCanonical,
  deleteQueueItem,
  saveItemImages,
} from './db';

export type QueueChangeListener = (items: QueueItemRecord[]) => void;

export class QueueManager {
  private static instance: QueueManager;
  private listeners: Set<QueueChangeListener> = new Set();
  private activeProcessingId: string | null = null;

  private constructor() {}

  public static getInstance(): QueueManager {
    if (!QueueManager.instance) {
      QueueManager.instance = new QueueManager();
    }
    return QueueManager.instance;
  }

  public subscribe(listener: QueueChangeListener): () => void {
    this.listeners.add(listener);
    this.notifyListeners();
    return () => {
      this.listeners.delete(listener);
    };
  }

  private async notifyListeners(): Promise<void> {
    try {
      const items = await getAllQueueItems();
      this.listeners.forEach((listener) => listener(items));
    } catch (err) {
      console.error('Failed to notify queue listeners:', err);
    }
  }

  public async addToQueue(urlInput: string): Promise<QueueItemRecord> {
    const parsed = parseTappytoonUrl(urlInput);
    if (!parsed.isValid || !parsed.canonicalUrl) {
      throw new Error(parsed.error || 'Invalid Tappytoon URL.');
    }

    const existing = await getQueueItemByCanonical(parsed.canonicalUrl);
    if (existing) {
      throw new Error(`This episode is already in the queue (Status: ${existing.status}).`);
    }

    const token = TappytoonAuthService.getAccessToken();
    const metadata = await TappytoonAdapter.fetchMetadata(parsed, token || undefined);

    if (metadata.accessStatus === 'login_required') {
      throw new Error('Authentication required to access this episode. Please log in to your Tappytoon account.');
    }

    if (metadata.accessStatus === 'purchase_required') {
      throw new Error('This episode requires purchase or unlock on your Tappytoon account.');
    }

    const newItem: QueueItemRecord = {
      id: parsed.canonicalUrl,
      canonicalUrl: parsed.canonicalUrl,
      rawUrl: urlInput,
      seriesTitle: metadata.seriesTitle,
      episodeTitle: metadata.episodeTitle,
      episodeNumber: metadata.episodeNumber,
      thumbnailUrl: metadata.thumbnailUrl,
      status: 'Waiting',
      progress: 0,
      imageCount: metadata.estimatedImageCount,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await saveQueueItem(newItem);
    await this.notifyListeners();

    this.processNextInQueue();

    return newItem;
  }

  public async processNextInQueue(): Promise<void> {
    if (this.activeProcessingId) {
      return;
    }

    const items = await getAllQueueItems();
    const waitingItem = items.find((item) => item.status === 'Waiting');

    if (!waitingItem) {
      return;
    }

    this.activeProcessingId = waitingItem.id;
    const parsed = parseTappytoonUrl(waitingItem.canonicalUrl);

    try {
      waitingItem.status = 'Processing';
      waitingItem.progress = 10;
      waitingItem.updatedAt = Date.now();
      await saveQueueItem(waitingItem);
      await this.notifyListeners();

      const token = TappytoonAuthService.getAccessToken();
      const result = await TappytoonAdapter.extractImages(
        parsed,
        async (progress) => {
          waitingItem.progress = Math.min(100, Math.max(10, progress));
          waitingItem.updatedAt = Date.now();
          await saveQueueItem(waitingItem);
          await this.notifyListeners();
        },
        token || undefined
      );

      await saveItemImages(waitingItem.id, result.images);

      waitingItem.status = 'Completed';
      waitingItem.progress = 100;
      waitingItem.imageCount = result.images.length;
      if (result.metadata.seriesTitle) waitingItem.seriesTitle = result.metadata.seriesTitle;
      if (result.metadata.episodeTitle) waitingItem.episodeTitle = result.metadata.episodeTitle;
      waitingItem.errorMessage = undefined;
      waitingItem.updatedAt = Date.now();
      await saveQueueItem(waitingItem);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      waitingItem.status = 'Failed';
      waitingItem.errorMessage = errorMsg;
      waitingItem.updatedAt = Date.now();
      await saveQueueItem(waitingItem);
    } finally {
      this.activeProcessingId = null;
      await this.notifyListeners();
      this.processNextInQueue();
    }
  }

  public async retryItem(id: string): Promise<void> {
    const items = await getAllQueueItems();
    const item = items.find((i) => i.id === id);
    if (!item) return;

    item.status = 'Waiting';
    item.progress = 0;
    item.errorMessage = undefined;
    item.updatedAt = Date.now();

    await saveQueueItem(item);
    await this.notifyListeners();

    this.processNextInQueue();
  }

  public async removeItem(id: string): Promise<void> {
    await deleteQueueItem(id);
    await this.notifyListeners();
  }
}
