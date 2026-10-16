import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

// GET /api/viewers?q=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';

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
