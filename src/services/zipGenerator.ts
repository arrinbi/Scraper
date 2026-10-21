import JSZip from 'jszip';
import { getItemImages } from './db';

export function formatSequentialFilename(index: number, extension: string = 'jpg'): string {
  const numStr = String(index + 1).padStart(3, '0');
  const cleanExt = extension.replace(/^\./, '');
  return `${numStr}.${cleanExt}`;
}

export function sanitizeFilename(name: string): string {
  return name
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export async function createZipBlobFromImages(
  images: { filename: string; blob: Blob; index?: number }[]
): Promise<Blob> {
  const zip = new JSZip();

  const sorted = [...images].sort((a, b) => {
    if (a.index !== undefined && b.index !== undefined) {
      return a.index - b.index;
    }
    return a.filename.localeCompare(b.filename);
  });

  sorted.forEach((img, i) => {
    const extension = img.filename.split('.').pop() || 'jpg';
    const paddedName = formatSequentialFilename(i, extension);
    zip.file(paddedName, img.blob);
  });

  return await zip.generateAsync({ type: 'blob' });
}

export async function generateQueueItemZip(queueItemId: string): Promise<Blob> {
  const imageRecords = await getItemImages(queueItemId);
  if (!imageRecords || imageRecords.length === 0) {
    throw new Error('No images found in database for this item.');
  }

  return await createZipBlobFromImages(
    imageRecords.map((rec) => ({
      filename: rec.filename,
      blob: rec.blob,
      index: rec.index,
    }))
  );
}

export function triggerBlobDownload(blob: Blob, defaultFilename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = defaultFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 10000);
}
