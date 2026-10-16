import { NextRequest } from 'next/server';
import { store } from '@/lib/store';
import { RealtimeEvent } from '@/types';
import { getD1Requests, getD1Settings } from '@/db/d1-service';

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  // Sync latest from D1 before initializing stream
  try {
    const d1Requests = await getD1Requests();
    if (d1Requests !== null) store.syncRequestsFromD1(d1Requests);
    const d1Settings = await getD1Settings();
    if (d1Settings !== null) store.syncSettingsFromD1(d1Settings);
  } catch (err) {
    console.error('SSE D1 sync error:', err);
  }

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      const initialPayload = JSON.stringify({
        type: 'CONNECTED',
        payload: {
          requests: store.getSortedRequests(),
          settings: store.getSettings(),
        },
        timestamp: new Date().toISOString(),
      });
      controller.enqueue(encoder.encode(`data: ${initialPayload}\n\n`));

      // Subscribe to store updates
      const unsubscribe = store.subscribe((event: RealtimeEvent) => {
        try {
          const data = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(data));
        } catch (err) {
          console.error('Error enqueuing SSE event:', err);
        }
      });

      // Keepalive heartbeat every 20 seconds
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch {
          clearInterval(heartbeatInterval);
        }
      }, 20000);

      req.signal.addEventListener('abort', () => {
        unsubscribe();
        clearInterval(heartbeatInterval);
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
