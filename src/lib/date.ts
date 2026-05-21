export const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export const MONTHS_OF_YEAR = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isPastDay(date: Date, today: Date = new Date()): boolean {
  return startOfDay(date).getTime() < startOfDay(today).getTime();
}

export function toISODateOnly(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function fromISODateOnly(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatLongDate(date: Date): string {
  return `${DAYS_OF_WEEK[date.getDay()]}, ${date.getDate()} ${MONTHS_OF_YEAR[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatShortDate(date: Date): string {
  return `${MONTHS_OF_YEAR[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export function pad2(value: number | string): string {
  return String(value).padStart(2, '0');
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function daysBetween(start: Date, end: Date): number {
  return Math.round((startOfDay(end).getTime() - startOfDay(start).getTime()) / MS_PER_DAY);
}

export function nightsBetween(start: Date, end: Date): number {
  return Math.max(0, daysBetween(start, end));
}

export function isDateInRange(date: Date, start: Date | null, end: Date | null): boolean {
  if (!start || !end) return false;
  const t = startOfDay(date).getTime();
  return t >= startOfDay(start).getTime() && t <= startOfDay(end).getTime();
}

export function expandRangeISO(startISO: string, endISO: string): string[] {
  const out: string[] = [];
  const start = fromISODateOnly(startISO);
  const end = fromISODateOnly(endISO);
  const d = startOfDay(start);
  const last = startOfDay(end);
  while (d.getTime() <= last.getTime()) {
    out.push(toISODateOnly(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export function formatRange(start: Date, end: Date): string {
  if (isSameDay(start, end)) return formatShortDate(start);
  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();
  if (sameMonth) {
    return `${MONTHS_OF_YEAR[start.getMonth()]} ${start.getDate()}–${end.getDate()}, ${end.getFullYear()}`;
  }
  if (sameYear) {
    return `${MONTHS_OF_YEAR[start.getMonth()]} ${start.getDate()} – ${MONTHS_OF_YEAR[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
  }
  return `${formatShortDate(start)} – ${formatShortDate(end)}`;
}
