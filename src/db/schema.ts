import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const requests = sqliteTable('requests', {
  id: text('id').primaryKey(),
  viewerName: text('viewer_name').notNull(),
  requestType: text('request_type').notNull(), // 'LAGU' | 'FANSIGN' | 'PAP' | 'COSPLAY'
  cosplaySubType: text('cosplay_sub_type'),    // 'ANIME' | 'GAME' | null
  details: text('details').notNull(),
  youtubeVideoId: text('youtube_video_id'),
  youtubeTitle: text('youtube_title'),
  isFastTrack: integer('is_fast_track', { mode: 'boolean' }).default(false).notNull(),
  fastTrackedAt: text('fast_tracked_at'),
  status: text('status').default('PENDING').notNull(), // 'PENDING' | 'PLAYING' | 'COMPLETED' | 'DELETED'
  source: text('source').default('MANUAL').notNull(), // 'MANUAL' | 'TIKTOK_GIFT' | 'TIKTOK_CHAT'
  addedBy: text('added_by'),
  createdAt: text('created_at').notNull(),
  completedAt: text('completed_at'),
  order: integer('order'),
});

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const viewers = sqliteTable('viewers', {
  id: text('id').primaryKey(),
  name: text('name').unique().notNull(),
  totalRequests: integer('total_requests').default(0).notNull(),
  createdAt: text('created_at').notNull(),
  lastSeenAt: text('last_seen_at').notNull(),
});

export type DBRequest = typeof requests.$inferSelect;
export type NewDBRequest = typeof requests.$inferInsert;
export type DBSetting = typeof settings.$inferSelect;
export type DBViewer = typeof viewers.$inferSelect;
export type NewDBViewer = typeof viewers.$inferInsert;

