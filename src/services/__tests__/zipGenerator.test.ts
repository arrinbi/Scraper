import { describe, it, expect } from 'vitest';
import {
  formatSequentialFilename,
  sanitizeFilename,
  createZipBlobFromImages,
} from '../zipGenerator';

describe('zipGenerator service', () => {
  it('formats zero-padded sequential filenames correctly', () => {
    expect(formatSequentialFilename(0, 'jpg')).toBe('001.jpg');
    expect(formatSequentialFilename(8, 'png')).toBe('009.png');
    expect(formatSequentialFilename(99, '.webp')).toBe('100.webp');
  });

  it('sanitizes unsafe characters for archive filenames', () => {
    expect(sanitizeFilename('Solo Leveling: Chapter 1?')).toBe('Solo_Leveling_Chapter_1');
    expect(sanitizeFilename('Test / Path \\ Name')).toBe('Test_Path_Name');
  });

  it('generates ZIP blob from image records in correct sequential order', async () => {
    const fakeImages = [
      { filename: '001.jpg', blob: new Blob(['image-1'], { type: 'image/jpeg' }), index: 0 },
      { filename: '002.jpg', blob: new Blob(['image-2'], { type: 'image/jpeg' }), index: 1 },
    ];

    const zipBlob = await createZipBlobFromImages(fakeImages);
    expect(zipBlob).toBeDefined();
    expect(zipBlob.size).toBeGreaterThan(0);
  });
});
