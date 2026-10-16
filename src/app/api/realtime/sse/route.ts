import { NextRequest } from 'next/server';
import { store } from '@/lib/store';
import { RealtimeEvent } from '@/types';

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

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
    },
  });
}
