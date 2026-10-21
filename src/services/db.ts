import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface QueueItemRecord {
  id: string;
  canonicalUrl: string;
  rawUrl: string;
  seriesTitle: string;
  episodeTitle: string;
  episodeNumber?: string;
  thumbnailUrl?: string;
  status: 'Waiting' | 'Processing' | 'Completed' | 'Failed';
  progress: number;
  imageCount?: number;
  errorMessage?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ImageBlobRecord {
  id: string;
  queueItemId: string;
  index: number;
  filename: string;
  blob: Blob;
  mimeType: string;
}

interface ScraperDB extends DBSchema {
  queue: {
    key: string;
    value: QueueItemRecord;
    indexes: { 'by-created': number; 'by-canonical': string };
  };
  images: {
    key: string;
    value: ImageBlobRecord;
    indexes: { 'by-queueItem': string };
  };
}

let dbPromise: Promise<IDBPDatabase<ScraperDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<ScraperDB>> {
  if (!dbPromise) {
    dbPromise = openDB<ScraperDB>('tappytoon-scraper-db', 1, {
      upgrade(db) {
        const queueStore = db.createObjectStore('queue', { keyPath: 'id' });
        queueStore.createIndex('by-created', 'createdAt');
        queueStore.createIndex('by-canonical', 'canonicalUrl');

        const imageStore = db.createObjectStore('images', { keyPath: 'id' });
        imageStore.createIndex('by-queueItem', 'queueItemId');
      },
    });
  }
  return dbPromise;
}

export async function saveQueueItem(item: QueueItemRecord): Promise<void> {
  const db = await getDB();
  await db.put('queue', item);
}

export async function getQueueItem(id: string): Promise<QueueItemRecord | undefined> {
  const db = await getDB();
  return db.get('queue', id);
}

export async function getQueueItemByCanonical(canonicalUrl: string): Promise<QueueItemRecord | undefined> {
  const db = await getDB();
  return db.getFromIndex('queue', 'by-canonical', canonicalUrl);
}

export async function getAllQueueItems(): Promise<QueueItemRecord[]> {
  const db = await getDB();
  const items = await db.getAllFromIndex('queue', 'by-created');
  return items.reverse();
}

export async function deleteQueueItem(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['queue', 'images'], 'readwrite');
  await tx.objectStore('queue').delete(id);

  const imageIndex = tx.objectStore('images').index('by-queueItem');
  let cursor = await imageIndex.openCursor(id);
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;
}

export async function saveItemImages(queueItemId: string, images: { filename: string; blob: Blob; mimeType: string }[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('images', 'readwrite');
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    await tx.store.put({
      id: `${queueItemId}_${i}`,
      queueItemId,
      index: i,
      filename: img.filename,
      blob: img.blob,
      mimeType: img.mimeType,
    });
  }
  await tx.done;
}

export async function getItemImages(queueItemId: string): Promise<ImageBlobRecord[]> {
  const db = await getDB();
  const items = await db.getAllFromIndex('images', 'by-queueItem', queueItemId);
  return items.sort((a, b) => a.index - b.index);
}
