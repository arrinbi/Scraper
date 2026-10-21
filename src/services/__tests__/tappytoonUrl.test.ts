import { describe, it, expect } from 'vitest';
import { parseTappytoonUrl, formatSeriesTitle } from '../tappytoonUrl';

describe('tappytoonUrl service', () => {
  it('parses valid episode URL under /comics/ format', () => {
    const res = parseTappytoonUrl('https://www.tappytoon.com/en/comics/solo-leveling/1');
    expect(res.isValid).toBe(true);
    expect(res.seriesSlug).toBe('solo-leveling');
    expect(res.episodeId).toBe('1');
    expect(res.language).toBe('en');
    expect(res.canonicalUrl).toBe('https://www.tappytoon.com/en/comics/solo-leveling/1');
  });

  it('parses valid chapter URL under /chapters/ format', () => {
    const res = parseTappytoonUrl('https://m.tappytoon.com/en/chapters/12345');
    expect(res.isValid).toBe(true);
    expect(res.episodeId).toBe('12345');
    expect(res.canonicalUrl).toBe('https://www.tappytoon.com/en/chapters/12345');
  });

  it('rejects series URL without episode number', () => {
    const res = parseTappytoonUrl('https://www.tappytoon.com/en/comics/solo-leveling');
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('series page URL');
  });

  it('rejects non-Tappytoon domain URLs', () => {
    const res = parseTappytoonUrl('https://example.com/comics/solo-leveling/1');
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('tappytoon.com');
  });

  it('formats series slug to human readable title', () => {
    expect(formatSeriesTitle('solo-leveling')).toBe('Solo Leveling');
    expect(formatSeriesTitle('the-beginning-after-the-end')).toBe('The Beginning After The End');
  });
});
