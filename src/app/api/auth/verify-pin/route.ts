import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function POST(req: NextRequest) {
  try {
    const { pin } = await req.json();
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
