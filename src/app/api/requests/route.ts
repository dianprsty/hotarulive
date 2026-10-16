import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { resolveYouTubeVideo, extractYouTubeVideoId } from '@/lib/youtube';
import { RequestType, CosplaySubType } from '@/types';

export async function GET() {
  const requests = store.getSortedRequests();
  const settings = store.getSettings();
  return NextResponse.json({ requests, settings });
}

export async function DELETE() {
  store.clearAll();
  return NextResponse.json({ success: true, message: 'Semua antrean request dan penonton berhasil dibersihkan' });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { viewerName, requestType, cosplaySubType, details, isFastTrack, source, addedBy } = body;

    if (!viewerName || !requestType) {
      return NextResponse.json(
        { error: 'Nama penonton dan tipe request wajib diisi' },
        { status: 400 }
      );
    }

    if (requestType === 'LAGU' && !details) {
      return NextResponse.json(
        { error: 'Judul lagu wajib diisi untuk request lagu' },
        { status: 400 }
      );
    }

    let finalDetails = details ? String(details).trim() : '';
    if (requestType === 'PAP') {
      finalDetails = 'PAP';
    } else if (requestType === 'FANSIGN') {
      finalDetails = finalDetails || String(viewerName).trim() || 'Fansign';
    } else if (requestType === 'COSPLAY') {
      finalDetails = finalDetails || (cosplaySubType ? `Cosplay ${cosplaySubType}` : 'Request Cosplay');
    }

    let youtubeVideoId: string | null = body.youtubeVideoId || null;
    let youtubeTitle: string | null = body.youtubeTitle || null;

    if (requestType === 'LAGU' && !youtubeVideoId) {
      const resolved = await resolveYouTubeVideo(finalDetails);
      if (resolved) {
        youtubeVideoId = resolved.videoId;
        youtubeTitle = resolved.title;
      } else {
        youtubeVideoId = extractYouTubeVideoId(finalDetails);
      }
    }

    const newRequest = store.addRequest({
      viewerName: String(viewerName).trim(),
      requestType: requestType as RequestType,
      cosplaySubType: (cosplaySubType as CosplaySubType) || null,
      details: finalDetails,
      youtubeVideoId,
      youtubeTitle,
      isFastTrack: requestType === 'LAGU' ? Boolean(isFastTrack) : false,
      source: source || 'MANUAL',
      addedBy: addedBy || 'HOST',
    });

    return NextResponse.json({ success: true, request: newRequest }, { status: 201 });
  } catch (err: any) {
    console.error('Error creating request:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
