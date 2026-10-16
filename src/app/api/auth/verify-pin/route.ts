import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { getD1Settings } from '@/db/d1-service';

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
    const { pin } = await req.json();
    const d1Settings = await getD1Settings();
    if (d1Settings !== null) {
      store.syncSettingsFromD1(d1Settings);
    }
    const settings = store.getSettings();

    if (String(pin).trim() === settings.moderatorPin.trim()) {
      return NextResponse.json({ success: true, authorized: true });
    }

    return NextResponse.json(
      { success: false, authorized: false, error: 'PIN Moderator salah' },
      { status: 401 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
