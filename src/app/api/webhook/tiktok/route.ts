import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { resolveYouTubeVideo } from '@/lib/youtube';
import { RequestType, CosplaySubType } from '@/types';
import { insertD1Request, upsertD1Viewer } from '@/db/d1-service';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const webhookSecret = process.env.TIKTOK_WEBHOOK_SECRET || 'weblivehub_secret_2026';

    if (authHeader && authHeader !== `Bearer ${webhookSecret}`) {
      return NextResponse.json({ error: 'Unauthorized webhook' }, { status: 401 });
    }

    const payload = await req.json();
    const { eventType, user, comment, giftName, giftCoins } = payload;

    // Case 1: Gift Event (Fast Track detection)
    if (eventType === 'GIFT') {
      const isSultanGift =
        (giftCoins && giftCoins >= 500) ||
        /paus|singa|whale|lion|corvette|rocket|leon/i.test(giftName || '');

      let requestType: RequestType = 'LAGU';
      let details = comment || `Gift ${giftName || 'Sultan'} dari ${user}`;
      let youtubeVideoId: string | null = null;
      let youtubeTitle: string | null = null;

      // Check if comment specifies song or other request
      if (comment) {
        const lowerComment = comment.toLowerCase();
        if (lowerComment.startsWith('!req')) {
          const parts = comment.replace(/^!req\s+/i, '').trim().split(/\s+(.+)/);
          const rawType = (parts[0] || '').toUpperCase();
          if (['LAGU', 'FANSIGN', 'PAP', 'COSPLAY'].includes(rawType)) {
            requestType = rawType as RequestType;
            details = parts[1] || details;
          }
        }

        if (requestType === 'LAGU') {
          const resolved = await resolveYouTubeVideo(details);
          if (resolved) {
            youtubeVideoId = resolved.videoId;
            youtubeTitle = resolved.title;
          }
        }
      }

      const item = store.addRequest({
        viewerName: user || 'TikTok Sultan',
        requestType,
        details,
        youtubeVideoId,
        youtubeTitle,
        isFastTrack: isSultanGift,
        source: 'TIKTOK_GIFT',
        addedBy: `TikTok Gift: ${giftName || 'Gift'} (${giftCoins || 0} koin)`,
      });

      try {
        await insertD1Request(item);
        const v = store.findViewerByName(item.viewerName);
        if (v) await upsertD1Viewer(v);
      } catch (d1Err) {
        console.error('Failed to sync tiktok gift request to D1:', d1Err);
      }

      return NextResponse.json({ success: true, processed: 'GIFT', item });
    }

    // Case 2: Chat Command (!req [Tipe] [Detail])
    if (eventType === 'CHAT' && comment && comment.startsWith('!req')) {
      const rawContent = comment.replace(/^!req\s+/i, '').trim();
      const parts = rawContent.split(/\s+(.+)/);
      const rawType = (parts[0] || 'LAGU').toUpperCase();
      const details = (parts[1] || '').trim();

      let requestType: RequestType = 'LAGU';
      let cosplaySubType: CosplaySubType | null = null;

      if (['LAGU', 'FANSIGN', 'PAP', 'COSPLAY'].includes(rawType)) {
        requestType = rawType as RequestType;
      } else {
        requestType = 'LAGU';
      }

      if (requestType === 'LAGU' && !details) {
        return NextResponse.json({ skipped: true, reason: 'Judul lagu wajib diisi' });
      }

      let finalDetails = details;
      if (requestType === 'PAP') {
        finalDetails = 'PAP';
      } else if (requestType === 'FANSIGN') {
        finalDetails = finalDetails || user || 'Fansign';
      } else if (requestType === 'COSPLAY') {
        cosplaySubType = /game/i.test(details) ? 'GAME' : 'ANIME';
        finalDetails = finalDetails || (cosplaySubType ? `Cosplay ${cosplaySubType}` : 'Request Cosplay');
      }

      let youtubeVideoId: string | null = null;
      let youtubeTitle: string | null = null;

      if (requestType === 'LAGU') {
        const resolved = await resolveYouTubeVideo(finalDetails);
        if (resolved) {
          youtubeVideoId = resolved.videoId;
          youtubeTitle = resolved.title;
        }
      }

      const item = store.addRequest({
        viewerName: user || 'Penonton TikTok',
        requestType,
        cosplaySubType,
        details: finalDetails,
        youtubeVideoId,
        youtubeTitle,
        isFastTrack: false,
        source: 'TIKTOK_CHAT',
        addedBy: 'TikTok Live Chat (!req)',
      });

      try {
        await insertD1Request(item);
        const v = store.findViewerByName(item.viewerName);
        if (v) await upsertD1Viewer(v);
      } catch (d1Err) {
        console.error('Failed to sync tiktok chat request to D1:', d1Err);
      }

      return NextResponse.json({ success: true, processed: 'CHAT', item });
    }

    return NextResponse.json({ received: true, ignored: true });
  } catch (err: any) {
    console.error('TikTok webhook error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
