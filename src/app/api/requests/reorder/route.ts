import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderedIds } = body;

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return NextResponse.json(
        { error: 'orderedIds harus berupa array id request' },
        { status: 400 }
      );
    }

    const updatedRequests = store.reorderRequests(orderedIds);
    return NextResponse.json({ success: true, requests: updatedRequests });
  } catch (err: any) {
    console.error('Error reordering requests:', err);
    return NextResponse.json(
      { error: err.message || 'Gagal mengubah urutan antrean' },
      { status: 500 }
     );
  }
}
