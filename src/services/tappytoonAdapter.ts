import { ParsedTappytoonUrl, formatSeriesTitle } from './tappytoonUrl';
import { TappytoonAuthService } from './tappytoonAuth';

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
  comicId?: number;
  chapterId?: number;
}

export interface ExtractionResult {
  success: boolean;
  metadata: EpisodeMetadata;
  images: { filename: string; blob: Blob; mimeType: string }[];
  errorMessage?: string;
}

const API_BASE = 'https://api-global.tappytoon.com';

export class TappytoonAdapter {
  /**
   * Fetches metadata for a Tappytoon episode URL using the Tappytoon REST API.
   * Leverages user authentication if logged in to access purchased / unlocked episodes.
   */
  static async fetchMetadata(
    parsed: ParsedTappytoonUrl,
    customToken?: string
  ): Promise<EpisodeMetadata> {
    if (!parsed.isValid || !parsed.canonicalUrl) {
      throw new Error(parsed.error || 'Invalid URL provided.');
    }

    const seriesTitleFallback = formatSeriesTitle(parsed.seriesSlug);
    const episodeTitleFallback = parsed.episodeId ? `Episode ${parsed.episodeId}` : 'Episode';
    const lang = parsed.language || 'en';
    const token = customToken ?? TappytoonAuthService.getAccessToken();

    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      let comicId: number | undefined;
      let seriesTitle = seriesTitleFallback;
      let comicThumbnail: string | undefined;

      // Step 1: If URL specifies a seriesSlug, search for comicId
      if (parsed.seriesSlug) {
        const searchUrl = `${API_BASE}/comics?keyword=${encodeURIComponent(parsed.seriesSlug)}&searchOption=url_slug_like&locale=${lang}`;
        const searchRes = await fetch(searchUrl, { headers }).catch(() => null);

        if (searchRes) {
          if (searchRes.status === 401 || searchRes.status === 403) {
            return {
              seriesTitle,
              episodeTitle: episodeTitleFallback,
              episodeNumber: parsed.episodeId,
              accessStatus: 'login_required',
              accessMessage: 'Authentication required. Please log in to your Tappytoon account to view this episode.',
            };
          }

          if (searchRes.ok) {
            const searchData = await searchRes.json();
            if (Array.isArray(searchData?.result) && searchData.result.length > 0) {
              comicId = searchData.result[0];
            }
          }
        }
      }

      // If comicId was found, optionally fetch comic details for title & cover
      if (comicId) {
        const comicRes = await fetch(`${API_BASE}/comics/${comicId}?locale=${lang}`, { headers }).catch(() => null);
        if (comicRes && comicRes.ok) {
          const comicData = await comicRes.json();
          if (comicData?.title) {
            seriesTitle = comicData.title;
          }
          if (comicData?.thumbnailUrl) {
            comicThumbnail = comicData.thumbnailUrl;
          }
        }
      }

      // Step 2: Fetch chapters list
      let chapters: any[] = [];
      if (comicId) {
        const chaptersRes = await fetch(`${API_BASE}/comics/${comicId}/chapters?sort=asc&limit=250&locale=${lang}`, { headers }).catch(() => null);

        if (chaptersRes) {
          if (chaptersRes.status === 401 || chaptersRes.status === 403) {
            return {
              seriesTitle,
              episodeTitle: episodeTitleFallback,
              episodeNumber: parsed.episodeId,
              accessStatus: 'login_required',
              accessMessage: 'Authentication required. Please log in to your Tappytoon account.',
            };
          }

          if (chaptersRes.ok) {
            chapters = await chaptersRes.json();
          }
        }
      }

      // Step 3: Identify the requested chapter
      let matchedChapter: any = null;
      if (parsed.episodeId) {
        const epStr = String(parsed.episodeId);

        // Try direct chapter ID match
        matchedChapter = chapters.find((c) => String(c.id) === epStr);

        // Try matching by order or orderInSeason
        if (!matchedChapter) {
          matchedChapter = chapters.find(
            (c) => String(c.order) === epStr || String(c.orderInSeason) === epStr
          );
        }

        // Try title match
        if (!matchedChapter) {
          matchedChapter = chapters.find((c) =>
            c.title && (c.title.toLowerCase().includes(`episode ${epStr}`) || c.title.toLowerCase().includes(`chapter ${epStr}`))
          );
        }

        // Fallback: 1-based order index
        if (!matchedChapter && !isNaN(Number(epStr))) {
          const idx = Number(epStr) - 1;
          if (idx >= 0 && idx < chapters.length) {
            matchedChapter = chapters[idx];
          }
        }
      }

      if (!matchedChapter && chapters.length > 0) {
        matchedChapter = chapters[0];
      }

      // If chapter direct lookup is available by episodeId when comicId was not resolved
      if (!matchedChapter && parsed.episodeId) {
        const chRes = await fetch(`${API_BASE}/chapters/${parsed.episodeId}?locale=${lang}`, { headers }).catch(() => null);
        if (chRes) {
          if (chRes.status === 401 || chRes.status === 403) {
            return {
              seriesTitle,
              episodeTitle: episodeTitleFallback,
              episodeNumber: parsed.episodeId,
              accessStatus: 'login_required',
              accessMessage: 'Authentication required. Please log in to your Tappytoon account.',
            };
          }
          if (chRes.ok) {
            matchedChapter = await chRes.json();
          }
        }
      }

      if (!matchedChapter) {
        if (!token) {
          return {
            seriesTitle,
            episodeTitle: episodeTitleFallback,
            episodeNumber: parsed.episodeId,
            accessStatus: 'login_required',
            accessMessage: 'Authentication required or episode not found. Please log in to your Tappytoon account.',
          };
        }
        return {
          seriesTitle,
          episodeTitle: episodeTitleFallback,
          episodeNumber: parsed.episodeId,
          accessStatus: 'purchase_required',
          accessMessage: 'Episode not found or requires purchase on Tappytoon.',
        };
      }

      const chapterId = matchedChapter.id;
      const episodeTitle = matchedChapter.title || episodeTitleFallback;
      const thumbnailUrl = matchedChapter.thumbnailUrl || comicThumbnail;

      // Check user access rights
      const isAccessible = matchedChapter.isAccessible || matchedChapter.isFree || matchedChapter.isUserUnlocked;
      if (matchedChapter.isAccessible === false && matchedChapter.isFree === false && matchedChapter.isUserUnlocked === false) {
        if (!token) {
          return {
            seriesTitle,
            episodeTitle,
            episodeNumber: parsed.episodeId,
            thumbnailUrl,
            comicId,
            chapterId,
            accessStatus: 'login_required',
            accessMessage: 'This episode requires user authentication to verify access permissions.',
          };
        }
        return {
          seriesTitle,
          episodeTitle,
          episodeNumber: parsed.episodeId,
          thumbnailUrl,
          comicId,
          chapterId,
          accessStatus: 'purchase_required',
          accessMessage: 'This episode requires purchase or unlock on your Tappytoon account.',
        };
      }

      // Step 4: Retrieve content images
      let contentData: any = null;
      const variants = ['high', 'original', 'super_high', 'low'];
      for (const variant of variants) {
        const contentRes = await fetch(
          `${API_BASE}/content-delivery/contents?chapterId=${chapterId}&variant=${variant}`,
          { headers }
        ).catch(() => null);

        if (contentRes) {
          if (contentRes.status === 401 || contentRes.status === 403) {
            return {
              seriesTitle,
              episodeTitle,
              episodeNumber: parsed.episodeId,
              thumbnailUrl,
              comicId,
              chapterId,
              accessStatus: 'login_required',
              accessMessage: 'Session expired or unauthorized. Please log in to your Tappytoon account.',
            };
          }

          if (contentRes.ok) {
            contentData = await contentRes.json();
            if (Array.isArray(contentData?.media) && contentData.media.length > 0) {
              break;
            }
          }
        }
      }

      if (!contentData || !Array.isArray(contentData.media) || contentData.media.length === 0) {
        if (!isAccessible && !token) {
          return {
            seriesTitle,
            episodeTitle,
            episodeNumber: parsed.episodeId,
            thumbnailUrl,
            comicId,
            chapterId,
            accessStatus: 'login_required',
            accessMessage: 'Please log in to your Tappytoon account to access episode images.',
          };
        }
        return {
          seriesTitle,
          episodeTitle,
          episodeNumber: parsed.episodeId,
          thumbnailUrl,
          comicId,
          chapterId,
          accessStatus: 'purchase_required',
          accessMessage: 'Episode images unavailable or account lacks purchase access.',
        };
      }

      // Sort media items by sortKey to ensure reading order
      const sortedMedia = [...contentData.media].sort(
        (a: any, b: any) => (a.sortKey ?? 0) - (b.sortKey ?? 0)
      );

      const imageUrls: string[] = sortedMedia
        .map((m: any) => m.path || m.url)
        .filter(Boolean);

      return {
        seriesTitle,
        episodeTitle,
        episodeNumber: parsed.episodeId,
        thumbnailUrl,
        comicId,
        chapterId,
        accessStatus: 'public',
        accessMessage: 'Episode accessible.',
        estimatedImageCount: imageUrls.length,
        imageUrls,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        seriesTitle: seriesTitleFallback,
        episodeTitle: episodeTitleFallback,
        episodeNumber: parsed.episodeId,
        accessStatus: 'restricted_cors',
        accessMessage: `Error querying Tappytoon API: ${msg}`,
      };
    }
  }

  /**
   * Downloads and extracts image payloads for a Tappytoon episode.
   * Reports progress percentage through onProgress callback.
   */
  static async extractImages(
    parsed: ParsedTappytoonUrl,
    onProgress?: (progressPercent: number) => void,
    customToken?: string
  ): Promise<ExtractionResult> {
    const metadata = await this.fetchMetadata(parsed, customToken);

    if (metadata.accessStatus === 'login_required') {
      throw new Error(
        'Authentication required to download this episode. Please log in to your Tappytoon account.'
      );
    }

    if (metadata.accessStatus === 'purchase_required') {
      throw new Error(
        'This episode requires purchase or unlock on your Tappytoon account before downloading.'
      );
    }

    if (metadata.accessStatus === 'restricted_cors') {
      throw new Error(metadata.accessMessage || 'Network error accessing Tappytoon API.');
    }

    const urls = metadata.imageUrls || [];
    const total = urls.length;

    if (total === 0) {
      throw new Error('No accessible images found in this episode payload.');
    }

    const images: { filename: string; blob: Blob; mimeType: string }[] = [];

    for (let i = 0; i < total; i++) {
      const imgUrl = urls[i];
      let res: Response;
      try {
        res = await fetch(imgUrl);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(`Failed to download image ${i + 1} of ${total}: ${msg}`);
      }

      if (!res.ok) {
        throw new Error(`Failed to download image ${i + 1} (HTTP status ${res.status}).`);
      }

      const blob = await res.blob();
      const rawExt = blob.type.split('/')[1] || 'jpg';
      const ext = rawExt.includes('jpeg') ? 'jpg' : rawExt;

      images.push({
        filename: `${String(i + 1).padStart(3, '0')}.${ext}`,
        blob,
        mimeType: blob.type || 'image/jpeg',
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
