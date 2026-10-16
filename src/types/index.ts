export type RequestType = 'LAGU' | 'FANSIGN' | 'PAP' | 'COSPLAY';
export type CosplaySubType = 'ANIME' | 'GAME';
export type RequestStatus = 'PENDING' | 'PLAYING' | 'COMPLETED' | 'DELETED';
export type RequestSource = 'MANUAL' | 'TIKTOK_GIFT' | 'TIKTOK_CHAT';

export interface RequestItem {
  id: string;
  viewerName: string;
  requestType: RequestType;
  cosplaySubType?: CosplaySubType | null;
  details: string;
  youtubeVideoId?: string | null;
  youtubeTitle?: string | null;
  isFastTrack: boolean;
  fastTrackedAt?: string | null;
  status: RequestStatus;
  source: RequestSource;
  addedBy?: string;
  createdAt: string;
  completedAt?: string | null;
  order?: number;
}

export interface SessionSettings {
  sessionTitle: string;
  hostName: string;
  moderatorPin: string;
  isAcceptingRequests: boolean;
  fastTrackMinGift: string;
  announcement: string;
  currentPlayingId: string | null;
  updatedAt: string;
}

export interface RealtimeEvent {
  type: 'CONNECTED' | 'REQUEST_CREATED' | 'REQUEST_UPDATED' | 'REQUEST_DELETED' | 'SETTINGS_UPDATED' | 'PLAYER_ACTION' | 'REQUESTS_REORDERED';
  payload: any;
  timestamp: string;
}

export interface YouTubeSearchResult {
  videoId: string;
  title: string;
  channelTitle?: string;
  duration?: string;
  thumbnail: string;
}

export interface Viewer {
  id: string;
  name: string;
  totalRequests: number;
  createdAt: string;
  lastSeenAt: string;
}

