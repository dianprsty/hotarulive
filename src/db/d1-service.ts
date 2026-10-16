import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getDb, requests, settings, viewers } from '@/db';
import { eq } from 'drizzle-orm';
import { RequestItem, SessionSettings, Viewer } from '@/types';

export async function getD1Db() {
  try {
    const ctx = await getCloudflareContext({ async: true });
    const env = ctx?.env as any;
    if (env && env.DB) {
      return getDb(env.DB);
    }
  } catch {
    // In local dev without workerd proxy, getCloudflareContext may throw or be null
  }
  return null;
}

export async function getD1Requests(): Promise<RequestItem[] | null> {
  const db = await getD1Db();
  if (!db) return null;

  try {
    const rows = await db.select().from(requests);
    return rows.map((r) => ({
      id: r.id,
      viewerName: r.viewerName,
      requestType: r.requestType as any,
      cosplaySubType: r.cosplaySubType as any,
      details: r.details,
      youtubeVideoId: r.youtubeVideoId,
      youtubeTitle: r.youtubeTitle,
      isFastTrack: Boolean(r.isFastTrack),
      fastTrackedAt: r.fastTrackedAt,
      status: r.status as any,
      source: r.source as any,
      addedBy: r.addedBy || undefined,
      createdAt: r.createdAt,
      completedAt: r.completedAt,
      order: r.order ?? undefined,
    }));
  } catch (err) {
    console.error('Failed to get requests from D1:', err);
    return null;
  }
}

export async function getD1Settings(): Promise<SessionSettings | null> {
  const db = await getD1Db();
  if (!db) return null;

  try {
    const rows = await db.select().from(settings);
    if (!rows || rows.length === 0) return null;

    const res: any = {};
    rows.forEach((r) => {
      try {
        if (r.value === 'true') res[r.key] = true;
        else if (r.value === 'false') res[r.key] = false;
        else if (r.value === 'null') res[r.key] = null;
        else res[r.key] = r.value;
      } catch {
        res[r.key] = r.value;
      }
    });
    return res as SessionSettings;
  } catch (err) {
    console.error('Failed to get settings from D1:', err);
    return null;
  }
}

export async function getD1Viewers(): Promise<Viewer[] | null> {
  const db = await getD1Db();
  if (!db) return null;

  try {
    const rows = await db.select().from(viewers);
    return rows.map((v) => ({
      id: v.id,
      name: v.name,
      totalRequests: v.totalRequests,
      createdAt: v.createdAt,
      lastSeenAt: v.lastSeenAt,
    }));
  } catch (err) {
    console.error('Failed to get viewers from D1:', err);
    return null;
  }
}

export async function insertD1Request(item: RequestItem) {
  const db = await getD1Db();
  if (!db) return;

  try {
    await db
      .insert(requests)
      .values({
        id: item.id,
        viewerName: item.viewerName,
        requestType: item.requestType,
        cosplaySubType: item.cosplaySubType || null,
        details: item.details,
        youtubeVideoId: item.youtubeVideoId || null,
        youtubeTitle: item.youtubeTitle || null,
        isFastTrack: Boolean(item.isFastTrack),
        fastTrackedAt: item.fastTrackedAt || null,
        status: item.status,
        source: item.source,
        addedBy: item.addedBy || null,
        createdAt: item.createdAt,
        completedAt: item.completedAt || null,
        order: item.order !== undefined ? item.order : null,
      })
      .onConflictDoUpdate({
        target: requests.id,
        set: {
          viewerName: item.viewerName,
          requestType: item.requestType,
          cosplaySubType: item.cosplaySubType || null,
          details: item.details,
          youtubeVideoId: item.youtubeVideoId || null,
          youtubeTitle: item.youtubeTitle || null,
          isFastTrack: Boolean(item.isFastTrack),
          fastTrackedAt: item.fastTrackedAt || null,
          status: item.status,
          source: item.source,
          addedBy: item.addedBy || null,
          completedAt: item.completedAt || null,
          order: item.order !== undefined ? item.order : null,
        },
      });
  } catch (err) {
    console.error('Failed to insert request to D1:', err);
  }
}

export async function updateD1Request(id: string, updates: Partial<RequestItem>) {
  const db = await getD1Db();
  if (!db) return;

  try {
    const setValues: any = {};
    if (updates.viewerName !== undefined) setValues.viewerName = updates.viewerName;
    if (updates.requestType !== undefined) setValues.requestType = updates.requestType;
    if (updates.cosplaySubType !== undefined) setValues.cosplaySubType = updates.cosplaySubType || null;
    if (updates.details !== undefined) setValues.details = updates.details;
    if (updates.youtubeVideoId !== undefined) setValues.youtubeVideoId = updates.youtubeVideoId || null;
    if (updates.youtubeTitle !== undefined) setValues.youtubeTitle = updates.youtubeTitle || null;
    if (updates.isFastTrack !== undefined) setValues.isFastTrack = Boolean(updates.isFastTrack);
    if (updates.fastTrackedAt !== undefined) setValues.fastTrackedAt = updates.fastTrackedAt || null;
    if (updates.status !== undefined) setValues.status = updates.status;
    if (updates.source !== undefined) setValues.source = updates.source;
    if (updates.addedBy !== undefined) setValues.addedBy = updates.addedBy || null;
    if (updates.completedAt !== undefined) setValues.completedAt = updates.completedAt || null;
    if (updates.order !== undefined) setValues.order = updates.order;

    await db.update(requests).set(setValues).where(eq(requests.id, id));
  } catch (err) {
    console.error('Failed to update request in D1:', err);
  }
}

export async function deleteD1Request(id: string) {
  const db = await getD1Db();
  if (!db) return;

  try {
    await db.delete(requests).where(eq(requests.id, id));
  } catch (err) {
    console.error('Failed to delete request from D1:', err);
  }
}

export async function updateD1Orders(orders: { id: string; order: number }[]) {
  const db = await getD1Db();
  if (!db) return;

  try {
    for (const item of orders) {
      await db.update(requests).set({ order: item.order }).where(eq(requests.id, item.id));
    }
  } catch (err) {
    console.error('Failed to update orders in D1:', err);
  }
}

export async function upsertD1Viewer(viewer: Viewer) {
  const db = await getD1Db();
  if (!db) return;

  try {
    await db
      .insert(viewers)
      .values({
        id: viewer.id,
        name: viewer.name,
        totalRequests: viewer.totalRequests || 0,
        createdAt: viewer.createdAt,
        lastSeenAt: viewer.lastSeenAt,
      })
      .onConflictDoUpdate({
        target: viewers.name,
        set: {
          totalRequests: viewer.totalRequests || 0,
          lastSeenAt: viewer.lastSeenAt,
        },
      });
  } catch (err) {
    console.error('Failed to upsert viewer in D1:', err);
  }
}

export async function updateD1Setting(key: string, value: any) {
  const db = await getD1Db();
  if (!db) return;

  try {
    const stringVal = typeof value === 'object' ? JSON.stringify(value) : String(value ?? '');
    await db
      .insert(settings)
      .values({
        key,
        value: stringVal,
        updatedAt: new Date().toISOString(),
      })
      .onConflictDoUpdate({
        target: settings.key,
        set: {
          value: stringVal,
          updatedAt: new Date().toISOString(),
        },
      });
  } catch (err) {
    console.error('Failed to update setting in D1:', err);
  }
}
