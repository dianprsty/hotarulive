import { NextRequest, NextResponse } from 'next/server';
import { searchYouTubeVideos } from '@/lib/youtube';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');

  if (!q || !q.trim()) {
    return NextResponse.json({ error: 'Query parameter q is required', results: [] }, { status: 400 });
  }

  const results = await searchYouTubeVideos(q);

  return NextResponse.json({
    results,
    videoId: results[0]?.videoId || null,
    title: results[0]?.title || null,
  });
}
