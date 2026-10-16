import { YouTubeSearchResult } from '@/types';

/**
 * Helper to extract YouTube video ID from various URL formats or direct ID
 */
export function extractYouTubeVideoId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // Pattern 1: youtu.be/<id>
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];

  // Pattern 2: youtube.com/watch?v=<id>
  const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];

  // Pattern 3: youtube.com/shorts/<id>
  const shortsMatch = trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shortsMatch) return shortsMatch[1];

  // Pattern 4: youtube.com/embed/<id>
  const embedMatch = trimmed.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];

  // Pattern 5: Direct 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * Fetch video info for a specific video ID via YouTube's official free oEmbed endpoint
 */
export async function fetchYouTubeOEmbed(videoId: string): Promise<YouTubeSearchResult | null> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await fetch(oembedUrl, { next: { revalidate: 86400 } });
    if (res.ok) {
      const data = await res.json();
      return {
        videoId,
        title: data.title || `Video ${videoId}`,
        channelTitle: data.author_name || 'YouTube',
        thumbnail: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      };
    }
  } catch (err) {
    console.error('oEmbed fetch error:', err);
  }

  return {
    videoId,
    title: `YouTube Video (${videoId})`,
    thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
  };
}

/**
 * Live search YouTube and return top video candidates with thumbnail, title, channel, and duration
 */
export async function searchYouTubeVideos(query: string): Promise<YouTubeSearchResult[]> {
  if (!query || !query.trim()) return [];
  const cleanQuery = query.trim();

  // Case 1: Direct link or video ID provided
  const directId = extractYouTubeVideoId(cleanQuery);
  if (directId) {
    const oembedResult = await fetchYouTubeOEmbed(directId);
    return oembedResult ? [oembedResult] : [];
  }

  // Case 2: Query search via public YouTube HTML results
  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(cleanQuery)}`;
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      next: { revalidate: 3600 },
    });

    if (response.ok) {
      const html = await response.text();
      const jsonMatch =
        html.match(/var ytInitialData = ({[\s\S]*?});<\/script>/) ||
        html.match(/ytInitialData = ({[\s\S]*?});/);

      if (jsonMatch && jsonMatch[1]) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          const contents =
            parsed.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer
              ?.contents?.[0]?.itemSectionRenderer?.contents || [];

          const results: YouTubeSearchResult[] = [];

          for (const item of contents) {
            if (item.videoRenderer) {
              const v = item.videoRenderer;
              if (v.videoId) {
                results.push({
                  videoId: v.videoId,
                  title: v.title?.runs?.[0]?.text || cleanQuery,
                  channelTitle: v.ownerText?.runs?.[0]?.text || '',
                  duration: v.lengthText?.simpleText || '',
                  thumbnail:
                    v.thumbnail?.thumbnails?.[0]?.url ||
                    `https://img.youtube.com/vi/${v.videoId}/mqdefault.jpg`,
                });
              }
              if (results.length >= 5) break;
            }
          }

          if (results.length > 0) {
            return results;
          }
        } catch (jsonErr) {
          console.warn('Error parsing ytInitialData JSON:', jsonErr);
        }
      }

      // Regex fallback if JSON was not matched
      const idMatch = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
      if (idMatch && idMatch[1]) {
        const fallback = await fetchYouTubeOEmbed(idMatch[1]);
        if (fallback) return [fallback];
      }
    }
  } catch (err) {
    console.error('YouTube search error:', err);
  }

  return [];
}

/**
 * Resolves single best matching video for backwards compatibility
 */
export async function resolveYouTubeVideo(
  query: string
): Promise<{ videoId: string; title: string } | null> {
  const list = await searchYouTubeVideos(query);
  if (list.length > 0) {
    return {
      videoId: list[0].videoId,
      title: list[0].title,
    };
  }
  return null;
}
