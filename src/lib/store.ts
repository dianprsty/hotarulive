import fs from 'fs';
import path from 'path';
import { RequestItem, SessionSettings, RealtimeEvent, Viewer } from '@/types';

const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

interface StoreData {
  requests: RequestItem[];
  settings: SessionSettings;
  viewers: Viewer[];
}

const defaultSettings: SessionSettings = {
  sessionTitle: 'Hotaru Live',
  hostName: 'Hotaru Live',
  moderatorPin: '8888',
  isAcceptingRequests: true,
  fastTrackMinGift: 'Paus / Singa / Gift Sultan (≥ 1000 Koin)',
  announcement: 'Selamat datang di Hotaru Live! Request Lagu, Fansign, PAP, atau Cosplay di komentar dengan format: !req [Tipe] [Detail]',
  currentPlayingId: null,
  updatedAt: new Date().toISOString(),
};

const initialSampleRequests: RequestItem[] = [
  {
    id: 'req_init_1',
    viewerName: 'Budi_Sultan99',
    requestType: 'LAGU',
    details: 'YOASOBI - Idol (Oshi no Ko OP)',
    youtubeVideoId: 'ZRtdQ81jPUQ',
    youtubeTitle: 'YOASOBI「アイドル」 Official Music Video',
    isFastTrack: true,
    status: 'PENDING',
    source: 'TIKTOK_GIFT',
    addedBy: 'SYSTEM (Gift: Paus)',
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: 'req_init_2',
    viewerName: 'RianWibu21',
    requestType: 'LAGU',
    details: 'Kenshi Yonezu - Kick Back',
    youtubeVideoId: 'M2cckDmNLMI',
    youtubeTitle: 'Kenshi Yonezu - KICK BACK',
    isFastTrack: true,
    status: 'PENDING',
    source: 'TIKTOK_GIFT',
    addedBy: 'MODERATOR',
    createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
  },
  {
    id: 'req_init_3',
    viewerName: 'Siti_Neko',
    requestType: 'FANSIGN',
    details: 'Fansign: "Semangat skripsinya Siti CatLover 🐾"',
    isFastTrack: false,
    status: 'PENDING',
    source: 'MANUAL',
    addedBy: 'MODERATOR',
    createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
  },
  {
    id: 'req_init_4',
    viewerName: 'AldoGaming',
    requestType: 'COSPLAY',
    cosplaySubType: 'GAME',
    details: 'Pose Raiden Shogun (Genshin Impact) pegang katana!',
    isFastTrack: false,
    status: 'PENDING',
    source: 'TIKTOK_CHAT',
    addedBy: 'HOST',
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: 'req_init_5',
    viewerName: 'MegaChan',
    requestType: 'PAP',
    details: 'PAP Duck face pose lucu ✌️',
    isFastTrack: false,
    status: 'COMPLETED',
    source: 'MANUAL',
    addedBy: 'HOST',
    createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  },
];

const initialSampleViewers: Viewer[] = [
  { id: 'v_1', name: 'Budi_Sultan99', totalRequests: 5, createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), lastSeenAt: new Date().toISOString() },
  { id: 'v_2', name: 'RianWibu21', totalRequests: 3, createdAt: new Date(Date.now() - 86400000 * 3).toISOString(), lastSeenAt: new Date().toISOString() },
  { id: 'v_3', name: 'Siti_Neko', totalRequests: 2, createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), lastSeenAt: new Date().toISOString() },
  { id: 'v_4', name: 'AldoGaming', totalRequests: 4, createdAt: new Date(Date.now() - 86400000 * 4).toISOString(), lastSeenAt: new Date().toISOString() },
  { id: 'v_5', name: 'MegaChan', totalRequests: 1, createdAt: new Date(Date.now() - 86400000 * 1).toISOString(), lastSeenAt: new Date().toISOString() },
];

// In-Memory Singleton Store
class MemoryStore {
  private data: StoreData;
  private sseListeners: Set<(event: RealtimeEvent) => void> = new Set();

  constructor() {
    this.data = this.loadFromDisk();
    this.normalizePendingSongOrders();
  }

  private normalizePendingSongOrders() {
    const pendingSongs = this.data.requests.filter(
      (r) => r.status === 'PENDING' && r.requestType === 'LAGU'
    );

    // Fast tracks: what added first is on top, newer below it (FIFO)
    const fastTracks = pendingSongs
      .filter((r) => r.isFastTrack)
      .sort((a, b) => {
        const timeA = new Date(a.fastTrackedAt || a.createdAt).getTime();
        const timeB = new Date(b.fastTrackedAt || b.createdAt).getTime();
        if (timeA !== timeB) return timeA - timeB;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

    // Normal songs: FIFO
    const normals = pendingSongs
      .filter((r) => !r.isFastTrack)
      .sort((a, b) => {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

    const ordered = [...fastTracks, ...normals];
    ordered.forEach((item, idx) => {
      const found = this.data.requests.find((r) => r.id === item.id);
      if (found) {
        found.order = idx;
        if (found.isFastTrack && !found.fastTrackedAt) {
          found.fastTrackedAt = found.createdAt;
        }
      }
    });

    this.saveToDisk();
  }

  private loadFromDisk(): StoreData {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          requests: parsed.requests || [],
          settings: { ...defaultSettings, ...(parsed.settings || {}) },
          viewers: parsed.viewers && parsed.viewers.length > 0 ? parsed.viewers : initialSampleViewers,
        };
      }
    } catch (err) {
      console.warn('Failed to read data file, using defaults:', err);
    }

    return {
      requests: initialSampleRequests,
      settings: defaultSettings,
      viewers: initialSampleViewers,
    };
  }

  private saveToDisk() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save to data file:', err);
    }
  }

  public subscribe(listener: (event: RealtimeEvent) => void): () => void {
    this.sseListeners.add(listener);
    return () => {
      this.sseListeners.delete(listener);
    };
  }

  public broadcast(type: RealtimeEvent['type'], payload: any) {
    const event: RealtimeEvent = {
      type,
      payload,
      timestamp: new Date().toISOString(),
    };
    this.sseListeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error('SSE listener error:', err);
      }
    });
  }

  // Requests API
  public getRequests(): RequestItem[] {
    return [...this.data.requests];
  }

  public getSortedRequests(): RequestItem[] {
    const list = this.data.requests.filter((r) => r.status !== 'DELETED');
    
    return list.sort((a, b) => {
      // 1. Current PLAYING on top
      if (a.status === 'PLAYING' && b.status !== 'PLAYING') return -1;
      if (b.status === 'PLAYING' && a.status !== 'PLAYING') return 1;

      // 2. Pending items before completed items
      if (a.status === 'PENDING' && b.status === 'COMPLETED') return -1;
      if (a.status === 'COMPLETED' && b.status === 'PENDING') return 1;

      // 3. For PENDING: Fast Track ALWAYS takes priority at the very top
      if (a.status === 'PENDING' && b.status === 'PENDING') {
        if (a.isFastTrack && !b.isFastTrack) return -1;
        if (!a.isFastTrack && b.isFastTrack) return 1;

        // Both are fast track: what added first should be on top, new should be below it
        if (a.isFastTrack && b.isFastTrack) {
          if (typeof a.order === 'number' && typeof b.order === 'number' && a.order !== b.order) {
            return a.order - b.order;
          }
          const timeA = new Date(a.fastTrackedAt || a.createdAt).getTime();
          const timeB = new Date(b.fastTrackedAt || b.createdAt).getTime();
          if (timeA !== timeB) {
            return timeA - timeB;
          }
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }

        // Both are normal songs
        if (typeof a.order === 'number' && typeof b.order === 'number' && a.order !== b.order) {
          return a.order - b.order;
        }
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }

      // 4. For COMPLETED: newest completed first
      if (a.status === 'COMPLETED' && b.status === 'COMPLETED') {
        const timeA = new Date(a.completedAt || a.createdAt).getTime();
        const timeB = new Date(b.completedAt || b.createdAt).getTime();
        return timeB - timeA;
      }

      return 0;
    });
  }

  public addRequest(item: Omit<RequestItem, 'id' | 'createdAt' | 'status'> & { id?: string; status?: RequestItem['status']; order?: number }): RequestItem {
    const isFastTrack = item.requestType === 'LAGU' ? Boolean(item.isFastTrack) : false;
    const now = new Date().toISOString();
    const fastTrackedAt = isFastTrack ? (item.fastTrackedAt || now) : null;

    const newRequest: RequestItem = {
      ...item,
      isFastTrack,
      fastTrackedAt,
      id: item.id || `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      status: item.status || 'PENDING',
      createdAt: now,
    };

    if (newRequest.requestType === 'LAGU' && newRequest.status === 'PENDING') {
      const pendingSongs = this.getSortedRequests().filter(
        (r) => r.status === 'PENDING' && r.requestType === 'LAGU'
      );
      const existingFastTracks = pendingSongs.filter((r) => r.isFastTrack);
      const existingNormals = pendingSongs.filter((r) => !r.isFastTrack);

      let newPendingList: RequestItem[] = [];
      if (isFastTrack) {
        // "what added first should be on top, and the new should be below it in the next order"
        // Existing fast tracks stay on top; new fast track is placed directly below them, ahead of normal songs
        newPendingList = [...existingFastTracks, newRequest, ...existingNormals];
      } else {
        // Normal song placed at the bottom of the pending list
        newPendingList = [...existingFastTracks, ...existingNormals, newRequest];
      }

      this.data.requests.push(newRequest);

      // Re-index all pending songs sequentially: 0, 1, 2, ...
      newPendingList.forEach((req, idx) => {
        const found = this.data.requests.find((r) => r.id === req.id);
        if (found) {
          found.order = idx;
        }
      });
      newRequest.order = newPendingList.findIndex((r) => r.id === newRequest.id);
    } else {
      newRequest.order = this.data.requests.length;
      this.data.requests.push(newRequest);
    }

    this.recordViewerRequest(newRequest.viewerName);
    this.saveToDisk();
    this.broadcast('REQUEST_CREATED', newRequest);
    return newRequest;
  }

  public reorderRequests(orderedIds: string[]): RequestItem[] {
    orderedIds.forEach((id, idx) => {
      const item = this.data.requests.find((r) => r.id === id);
      if (item) {
        item.order = idx;
      }
    });

    this.saveToDisk();
    const sorted = this.getSortedRequests();
    this.broadcast('REQUESTS_REORDERED', { orderedIds });
    return sorted;
  }

  public updateRequest(id: string, updates: Partial<RequestItem>): RequestItem | null {
    const index = this.data.requests.findIndex((r) => r.id === id);
    if (index === -1) return null;

    const current = this.data.requests[index];
    const isFastTrack = updates.isFastTrack !== undefined
      ? (current.requestType === 'LAGU' ? Boolean(updates.isFastTrack) : false)
      : current.isFastTrack;

    const fastTrackChanged = updates.isFastTrack !== undefined && isFastTrack !== current.isFastTrack;
    const statusChangedToPending = updates.status === 'PENDING' && current.status !== 'PENDING';

    let order = current.order;
    let fastTrackedAt = current.fastTrackedAt;
    if (fastTrackChanged) {
      fastTrackedAt = isFastTrack ? new Date().toISOString() : null;
    } else if (updates.fastTrackedAt !== undefined) {
      fastTrackedAt = updates.fastTrackedAt;
    }

    if ((fastTrackChanged || statusChangedToPending) && current.requestType === 'LAGU') {
      const pendingSongs = this.getSortedRequests().filter(
        (r) => r.status === 'PENDING' && r.requestType === 'LAGU' && r.id !== id
      );

      const existingFastTracks = pendingSongs.filter((r) => r.isFastTrack);
      const existingNormals = pendingSongs.filter((r) => !r.isFastTrack);

      const updatedCurrent: RequestItem = {
        ...current,
        ...updates,
        isFastTrack,
        fastTrackedAt,
      };

      let newPendingList: RequestItem[] = [];

      if (isFastTrack) {
        // "saat card ditandai fast track, card akan berada diurutan atas , jika sudah ada fasttrack yg lain maka fast track yg baru akan ada dipaling bawah fasttrack"
        // If there are existing fast tracks, new fast track goes directly after them (at the bottom of the fast track group)
        // If no existing fast tracks, it goes to index 0 (top of the queue)
        newPendingList = [...existingFastTracks, updatedCurrent, ...existingNormals];
      } else {
        // When fast track is turned off, place right after remaining fast tracks (top of normal songs)
        newPendingList = [...existingFastTracks, updatedCurrent, ...existingNormals];
      }

      newPendingList.forEach((item, idx) => {
        const found = this.data.requests.find((r) => r.id === item.id);
        if (found) {
          found.order = idx;
        }
        if (item.id === id) {
          order = idx;
        }
      });
    } else if (updates.status === 'COMPLETED' && current.status !== 'COMPLETED' && current.requestType === 'LAGU') {
      // Normalize remaining pending songs when an item is completed
      const remainingPending = this.getSortedRequests().filter(
        (r) => r.status === 'PENDING' && r.requestType === 'LAGU' && r.id !== id
      );
      remainingPending.forEach((item, idx) => {
        const found = this.data.requests.find((r) => r.id === item.id);
        if (found) {
          found.order = idx;
        }
      });
    }

    const updated: RequestItem = {
      ...current,
      ...updates,
      isFastTrack,
      fastTrackedAt,
      order,
      completedAt: updates.status === 'COMPLETED' ? new Date().toISOString() : current.completedAt,
    };

    this.data.requests[index] = updated;
    this.saveToDisk();
    this.broadcast('REQUEST_UPDATED', updated);
    return updated;
  }

  public deleteRequest(id: string): boolean {
    const index = this.data.requests.findIndex((r) => r.id === id);
    if (index === -1) return false;

    const removed = this.data.requests[index];
    this.data.requests.splice(index, 1);
    this.normalizePendingSongOrders();
    this.saveToDisk();
    this.broadcast('REQUEST_DELETED', { id, item: removed });
    return true;
  }

  // Viewers API
  public getViewers(search?: string): Viewer[] {
    if (!this.data.viewers) {
      this.data.viewers = [...initialSampleViewers];
    }
    if (!search || !search.trim()) {
      return [...this.data.viewers].sort((a, b) => (b.totalRequests || 0) - (a.totalRequests || 0));
    }
    const q = search.trim().toLowerCase();
    return this.data.viewers
      .filter((v) => v.name.toLowerCase().includes(q))
      .sort((a, b) => {
        const aLower = a.name.toLowerCase();
        const bLower = b.name.toLowerCase();
        if (aLower === q && bLower !== q) return -1;
        if (bLower === q && aLower !== q) return 1;
        if (aLower.startsWith(q) && !bLower.startsWith(q)) return -1;
        if (bLower.startsWith(q) && !aLower.startsWith(q)) return 1;
        return (b.totalRequests || 0) - (a.totalRequests || 0);
      });
  }

  public findViewerByName(name: string): Viewer | undefined {
    if (!this.data.viewers) {
      this.data.viewers = [...initialSampleViewers];
    }
    const trimmed = name.trim().toLowerCase();
    return this.data.viewers.find((v) => v.name.toLowerCase() === trimmed);
  }

  public addViewer(name: string): Viewer {
    if (!this.data.viewers) {
      this.data.viewers = [...initialSampleViewers];
    }
    const cleanName = name.trim();
    const existing = this.findViewerByName(cleanName);
    if (existing) {
      existing.lastSeenAt = new Date().toISOString();
      this.saveToDisk();
      return existing;
    }

    const newViewer: Viewer = {
      id: `v_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: cleanName,
      totalRequests: 0,
      createdAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
    };

    this.data.viewers.push(newViewer);
    this.saveToDisk();
    return newViewer;
  }

  public recordViewerRequest(name: string): Viewer {
    if (!this.data.viewers) {
      this.data.viewers = [...initialSampleViewers];
    }
    const cleanName = name.trim();
    let viewer = this.findViewerByName(cleanName);
    if (!viewer) {
      viewer = {
        id: `v_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: cleanName,
        totalRequests: 1,
        createdAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
      };
      this.data.viewers.push(viewer);
    } else {
      viewer.totalRequests = (viewer.totalRequests || 0) + 1;
      viewer.lastSeenAt = new Date().toISOString();
    }
    this.saveToDisk();
    return viewer;
  }

  // Settings API
  public getSettings(): SessionSettings {
    return { ...this.data.settings };
  }

  public updateSettings(updates: Partial<SessionSettings>): SessionSettings {
    this.data.settings = {
      ...this.data.settings,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveToDisk();
    this.broadcast('SETTINGS_UPDATED', this.data.settings);
    return { ...this.data.settings };
  }
}

// Global singleton instance across Next.js reloads with versioning
const STORE_VERSION = 3;
const globalForStore = globalThis as unknown as { __storeInstance?: MemoryStore; __storeVersion?: number };

if (globalForStore.__storeInstance && globalForStore.__storeVersion !== STORE_VERSION) {
  globalForStore.__storeInstance = undefined;
  globalForStore.__storeVersion = STORE_VERSION;
}

export const store = globalForStore.__storeInstance ?? new MemoryStore();
if (process.env.NODE_ENV !== 'production') {
  globalForStore.__storeInstance = store;
  globalForStore.__storeVersion = STORE_VERSION;
}

