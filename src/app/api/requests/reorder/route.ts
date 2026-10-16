import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { updateD1Orders } from '@/db/d1-service';

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

    try {
      const orders = orderedIds.map((id: string, index: number) => ({ id, order: index }));
      await updateD1Orders(orders);
    } catch (d1Err) {
      console.error('Failed to sync orders to D1:', d1Err);
    }

    return NextResponse.json({ success: true, requests: updatedRequests });
  } catch (err: any) {
    console.error('Error reordering requests:', err);
    return NextResponse.json(
      { error: err.message || 'Gagal mengubah urutan antrean' },
      { status: 500 }
    );
  }
}
