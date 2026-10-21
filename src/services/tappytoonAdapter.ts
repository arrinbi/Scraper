import { ParsedTappytoonUrl, formatSeriesTitle } from './tappytoonUrl';

export interface EpisodeMetadata {
  seriesTitle: string;
  episodeTitle: string;
  episodeNumber?: string;
  thumbnailUrl?: string;
  accessStatus: 'public' | 'login_required' | 'purchase_required' | 'restricted_cors';
  accessMessage: string;
  estimatedImageCount?: number;
  imageUrls?: string[];
  extractionNote?: string;
}

export interface ExtractionResult {
  success: boolean;
  metadata: EpisodeMetadata;
  images: { filename: string; blob: Blob; mimeType: string }[];
  errorMessage?: string;
}

export class TappytoonAdapter {
  static async fetchMetadata(parsed: ParsedTappytoonUrl): Promise<EpisodeMetadata> {
    if (!parsed.isValid || !parsed.canonicalUrl) {
      throw new Error(parsed.error || 'Invalid URL provided.');
    }

    const seriesTitle = formatSeriesTitle(parsed.seriesSlug);
    const episodeTitle = parsed.episodeId ? `Episode ${parsed.episodeId}` : 'Episode';

    try {
      const res = await fetch(parsed.canonicalUrl, { mode: 'cors', credentials: 'omit' }).catch(() => null);

      if (!res) {
        return {
          seriesTitle,
          episodeTitle,
          episodeNumber: parsed.episodeId,
          accessStatus: 'restricted_cors',
          accessMessage: 'Browser CORS restrictions apply. Cross-origin web scraping requires CORS proxy or browser extension / APK wrapper session.',
          extractionNote: 'Client-side browser security (CORS) prevents direct cross-origin HTML/API reading without user session or proxy wrapper.',
        };
      }

      if (res.status === 401 || res.status === 403) {
        return {
          seriesTitle,
          episodeTitle,
          episodeNumber: parsed.episodeId,
          accessStatus: 'login_required',
          accessMessage: 'Authentication or purchase required to access this episode on Tappytoon.',
        };
      }

      if (res.ok) {
        const text = await res.text();
        return {
          seriesTitle,
          episodeTitle,
          episodeNumber: parsed.episodeId,
          accessStatus: 'public',
          accessMessage: 'Public metadata accessible.',
          estimatedImageCount: undefined,
          extractionNote: text.includes('drm') ? 'Episode uses encrypted/protected rendering.' : undefined,
        };
      }

      return {
        seriesTitle,
        episodeTitle,
        episodeNumber: parsed.episodeId,
        accessStatus: 'restricted_cors',
        accessMessage: `Tappytoon server returned status ${res.status}.`,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        seriesTitle,
        episodeTitle,
        episodeNumber: parsed.episodeId,
        accessStatus: 'restricted_cors',
        accessMessage: `Unable to query metadata directly: ${msg}`,
      };
    }
  }

  static async extractImages(
    parsed: ParsedTappytoonUrl,
    onProgress?: (progressPercent: number) => void
  ): Promise<ExtractionResult> {
    const metadata = await this.fetchMetadata(parsed);

    if (metadata.accessStatus === 'restricted_cors') {
      throw new Error(
        'Cannot extract images directly due to Browser CORS restrictions on tappytoon.com. ' +
        'To download purchased content, an authenticated CORS proxy or Android Webview/APK wrapper session is required.'
      );
    }

    if (metadata.accessStatus === 'login_required' || metadata.accessStatus === 'purchase_required') {
      throw new Error('Episode requires login or purchase on Tappytoon. Please authenticate in browser or app.');
    }

    const images: { filename: string; blob: Blob; mimeType: string }[] = [];
    const total = metadata.imageUrls?.length || 0;

    if (total === 0) {
      throw new Error('No accessible images found in this episode payload.');
    }

    for (let i = 0; i < total; i++) {
      const url = metadata.imageUrls![i];
      const res = await fetch(url);
      const blob = await res.blob();
      const ext = blob.type.split('/')[1] || 'jpg';
      images.push({
        filename: `${String(i + 1).padStart(3, '0')}.${ext}`,
        blob,
        mimeType: blob.type,
      });

      if (onProgress) {
        onProgress(Math.round(((i + 1) / total) * 100));
      }
    }

    return {
      success: true,
      metadata,
      images,
    };
  }
}
