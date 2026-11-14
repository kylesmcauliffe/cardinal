export interface ParsedDate {
  start: number;
  end: number;
  precision: 'day' | 'month' | 'year' | 'range';
  y0: number;
  y1: number;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function parseDate(d: string | null | undefined): ParsedDate | null {
  if (!d) return null;
  const m = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?(?:\/(\d{4}))?$/.exec(d);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = m[2] ? Number(m[2]) : 0;
  const da = m[3] ? Number(m[3]) : 0;
  const start = y + (mo ? (mo - 1) / 12 : 0) + (da ? (da - 1) / 365 : 0);
  if (m[4]) return { start, end: Number(m[4]) + 0.999, precision: 'range', y0: y, y1: Number(m[4]) };
  const precision = da ? 'day' : mo ? 'month' : 'year';
  const end = precision === 'year' ? y + 0.999 : precision === 'month' ? y + mo / 12 : start;
  return { start, end, precision, y0: y, y1: y };
}

export function formatDate(d: string | null | undefined): string {
  const p = parseDate(d);
  if (!d || !p) return 'Date not recorded';
  const m = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?(?:\/(\d{4}))?$/.exec(d)!;
  if (m[4]) return `${m[1]}–${m[4]}`;
  if (m[3]) return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
  if (m[2]) return `${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
  return m[1];
}

export function yearOf(d: string | null | undefined): number | null {
  const p = parseDate(d);
  return p ? p.y0 : null;
}

export function sortKey(d: string | null | undefined): number {
  const p = parseDate(d);
  return p ? p.start : Number.POSITIVE_INFINITY;
}
