export interface ParsedTappytoonUrl {
  isValid: boolean;
  rawUrl: string;
  canonicalUrl?: string;
  seriesSlug?: string;
  episodeId?: string;
  language?: string;
  error?: string;
}

export function parseTappytoonUrl(inputUrl: string): ParsedTappytoonUrl {
  const trimmed = inputUrl.trim();
  if (!trimmed) {
    return { isValid: false, rawUrl: inputUrl, error: 'Please enter a URL.' };
  }

  let urlObj: URL;
  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    urlObj = new URL(withProtocol);
  } catch {
    return { isValid: false, rawUrl: inputUrl, error: 'Invalid URL format.' };
  }

  const hostname = urlObj.hostname.toLowerCase();
  if (!hostname.endsWith('tappytoon.com')) {
    return {
      isValid: false,
      rawUrl: inputUrl,
      error: 'URL must be a valid tappytoon.com link.',
    };
  }

  const pathParts = urlObj.pathname.split('/').filter(Boolean);
  if (pathParts.length < 2) {
    return {
      isValid: false,
      rawUrl: inputUrl,
      error: 'URL path is too short. Expected episode or comic link.',
    };
  }

  const language = pathParts[0];
  const type = pathParts[1].toLowerCase();

  if (type === 'comics' && pathParts.length >= 4) {
    const seriesSlug = pathParts[2];
    const episodeId = pathParts[3];
    const canonicalUrl = `https://www.tappytoon.com/${language}/comics/${seriesSlug}/${episodeId}`;
    return {
      isValid: true,
      rawUrl: inputUrl,
      canonicalUrl,
      seriesSlug,
      episodeId,
      language,
    };
  }

  if (type === 'chapters' && pathParts.length >= 3) {
    const episodeId = pathParts[2];
    const canonicalUrl = `https://www.tappytoon.com/${language}/chapters/${episodeId}`;
    return {
      isValid: true,
      rawUrl: inputUrl,
      canonicalUrl,
      episodeId,
      language,
    };
  }

  if (type === 'comics' && pathParts.length === 3) {
    return {
      isValid: false,
      rawUrl: inputUrl,
      error: 'This looks like a series page URL, not a specific episode. Please paste an episode URL (e.g. /comics/series-name/1).',
    };
  }

  return {
    isValid: false,
    rawUrl: inputUrl,
    error: 'Unrecognized Tappytoon URL format. Expected /en/comics/series-title/1 or /en/chapters/123.',
  };
}

export function formatSeriesTitle(slug?: string): string {
  if (!slug) return 'Tappytoon Comic';
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
