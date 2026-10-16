'use client';

import { useState, useEffect, useCallback } from 'react';
import { RequestItem, SessionSettings, RealtimeEvent } from '@/types';

export function useRealtimeQueue() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [settings, setSettings] = useState<SessionSettings | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/requests');
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
        setSettings(data.settings || null);
      }
    } catch (err) {
      console.error('Failed to fetch requests:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Setup SSE connection
    let eventSource: EventSource | null = null;
    let retryTimeout: NodeJS.Timeout;

    const connectSSE = () => {
      eventSource = new EventSource('/api/realtime/sse');

      eventSource.onopen = () => {
        setIsConnected(true);
      };

      eventSource.onmessage = (e) => {
        try {
          const event: RealtimeEvent = JSON.parse(e.data);

          if (event.type === 'CONNECTED' && event.payload) {
            setRequests(event.payload.requests || []);
            setSettings(event.payload.settings || null);
            setIsLoading(false);
          } else if (event.type === 'REQUEST_CREATED') {
            fetchData();
          } else if (event.type === 'REQUEST_UPDATED') {
            fetchData();
          } else if (event.type === 'REQUEST_DELETED') {
            fetchData();
          } else if (event.type === 'REQUESTS_REORDERED') {
            fetchData();
          } else if (event.type === 'SETTINGS_UPDATED') {
            setSettings(event.payload);
          }
        } catch {
          // ignore keepalive comments
        }
      };

      eventSource.onerror = () => {
        setIsConnected(false);
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        // Retry in 3 seconds
        retryTimeout = setTimeout(connectSSE, 3000);
      };
    };

    connectSSE();

    // Fallback sync polling every 10 seconds
    const interval = setInterval(fetchData, 10000);

    return () => {
      if (eventSource) eventSource.close();
      clearTimeout(retryTimeout);
      clearInterval(interval);
    };
  }, [fetchData]);

  return {
    requests,
    settings,
    isConnected,
    isLoading,
    refetch: fetchData,
  };
}
