import { RequestItem } from '@/types';

/**
 * Checks whether an ISO date string belongs to the current day in local timezone
 */
export function isToday(dateString?: string | null): boolean {
  if (!dateString) return false;
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

/**
 * Formats a date into a human readable Indonesian label with Hari Ini / Kemarin prefixes
 */
export function formatDateGroup(dateString: string): string {
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return 'Tanggal Tidak Diketahui';

  const now = new Date();
  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  const formatted = d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  if (isSameDay(d, now)) {
    return `Hari Ini • ${formatted}`;
  } else if (isSameDay(d, yesterday)) {
    return `Kemarin • ${formatted}`;
  }
  return formatted;
}

export interface DateGroupedRequests {
  dateKey: string;
  dateLabel: string;
  items: RequestItem[];
}

/**
 * Groups a list of RequestItems by date (using completedAt or createdAt) in descending order
 */
export function groupRequestsByDate(items: RequestItem[]): DateGroupedRequests[] {
  const map: Record<string, { label: string; dateObj: Date; items: RequestItem[] }> = {};

  items.forEach((item) => {
    const rawDate = item.completedAt || item.createdAt;
    const d = new Date(rawDate);
    const dateKey = !isNaN(d.getTime())
      ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      : 'unknown';

    if (!map[dateKey]) {
      map[dateKey] = {
        label: !isNaN(d.getTime()) ? formatDateGroup(rawDate) : 'Lainnya',
        dateObj: !isNaN(d.getTime()) ? d : new Date(0),
        items: [],
      };
    }
    map[dateKey].items.push(item);
  });

  // Sort groups descending (newest date first)
  const sortedKeys = Object.keys(map).sort((a, b) => {
    if (a === 'unknown') return 1;
    if (b === 'unknown') return -1;
    return map[b].dateObj.getTime() - map[a].dateObj.getTime();
  });

  return sortedKeys.map((key) => ({
    dateKey: key,
    dateLabel: map[key].label,
    items: map[key].items,
  }));
}
