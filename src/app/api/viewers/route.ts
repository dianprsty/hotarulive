import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { getD1Viewers, upsertD1Viewer } from '@/db/d1-service';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    },
  });
}

// GET /api/viewers?q=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';

    const d1Viewers = await getD1Viewers();
    if (d1Viewers !== null) {
      store.syncViewersFromD1(d1Viewers);
    }

    const viewers = store.getViewers(query);
    return NextResponse.json({ viewers });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Gagal mengambil data penonton' },
      { status: 500 }
    );
  }
}

// POST /api/viewers
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = (body.name || '').trim();

    if (!name) {
      return NextResponse.json(
        { error: 'Nama penonton tidak boleh kosong' },
        { status: 400 }
      );
    }

    const existing = store.findViewerByName(name);
    const viewer = store.addViewer(name);

    try {
      await upsertD1Viewer(viewer);
    } catch (d1Err) {
      console.error('Failed to sync viewer to D1:', d1Err);
    }

    return NextResponse.json({
      viewer,
      isNew: !existing,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Gagal menyimpan penonton baru' },
      { status: 500 }
    );
  }
}
