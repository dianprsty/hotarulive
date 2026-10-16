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
            if (Array.isArray(event.payload.requests) && event.payload.requests.length > 0) {
              setRequests(event.payload.requests);
            }
            if (event.payload.settings) {
              setSettings(event.payload.settings);
            }
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

    // Fast polling every 2 seconds for cross-device synchronization
    const interval = setInterval(fetchData, 2000);

    // Sync immediately on focus or when smartphone screen turns on
    const handleVisibility = () => {
      if (!document.hidden) {
        fetchData();
      }
    };
    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    return () => {
      if (eventSource) eventSource.close();
      clearTimeout(retryTimeout);
      clearInterval(interval);
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
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
