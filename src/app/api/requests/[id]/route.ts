import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { updateD1Request, deleteD1Request } from '@/db/d1-service';

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

    try {
      await updateD1Request(id, updates);
    } catch (d1Err) {
      console.error('Failed to sync update to D1:', d1Err);
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

    try {
      await deleteD1Request(id);
    } catch (d1Err) {
      console.error('Failed to sync delete to D1:', d1Err);
    }

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
