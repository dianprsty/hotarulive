import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await req.json();

    const updated = store.updateRequest(id, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Request tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, request: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ok = store.deleteRequest(id);
    if (!ok) {
      return NextResponse.json({ error: 'Request tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
