import type { Data } from './data';
import { parseDate } from './dates';
import { esc, href } from './html';

const W = 640;

function fig(svg: string, title: string, caption: string, id: string): string {
  return `<figure class="chart" id="${id}"><h3>${esc(title)}</h3>${svg}<figcaption>${caption}</figcaption></figure>`;
}

const HATCH = `<defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="none"/><line x1="0" y1="0" x2="0" y2="6" stroke="currentColor" stroke-width="2"/></pattern></defs>`;

export function decadeChart(d: Data): string {
  const dated = d.events.map((e) => ({ e, p: parseDate(e.date) })).filter((x) => x.p);
  const undated = d.events.length - dated.length;
  const decades = new Map<number, { v: number; o: number }>();
  for (const { e, p } of dated) {
    const dec = Math.floor(p!.y0 / 10) * 10;
    if (!decades.has(dec)) decades.set(dec, { v: 0, o: 0 });
    const s = decades.get(dec)!;
    if (e.status === 'VERIFIED') s.v++;
    else s.o++;
  }
  const keys = [...decades.keys()];
  const min = Math.min(...keys);
  const max = Math.max(...keys);
  const n = (max - min) / 10 + 1;
  const H = 250;
  const L = 34;
  const B = 28;
  const top = 12;
  const bw = (W - L) / n;
  const peak = Math.max(...[...decades.values()].map((s) => s.v + s.o));
  const y = (v: number) => top + (H - top - B) * (1 - v / peak);
  const parts: string[] = [HATCH];
  for (let g = 0; g <= peak; g += peak > 12 ? 5 : 2) {
    parts.push(`<line class="grid" x1="${L}" x2="${W}" y1="${y(g)}" y2="${y(g)}"/><text x="${L - 6}" y="${y(g) + 4}" text-anchor="end">${g}</text>`);
  }
  for (const [dec, s] of decades) {
    const x = L + ((dec - min) / 10) * bw + 2;
    const w = Math.max(3, bw - 4);
    if (s.v) parts.push(`<rect class="bar" x="${x}" y="${y(s.v)}" width="${w}" height="${y(0) - y(s.v)}"><title>${dec}s: ${s.v} verified</title></rect>`);
    if (s.o) parts.push(`<rect class="bar hatch" x="${x}" y="${y(s.v + s.o)}" width="${w}" height="${y(s.v) - y(s.v + s.o)}" style="color:var(--ink-dim)"><title>${dec}s: ${s.o} not yet verified</title></rect>`);
  }
  for (let dec = Math.ceil(min / 50) * 50; dec <= max; dec += 50) {
    parts.push(`<text x="${L + ((dec - min) / 10) * bw + bw / 2}" y="${H - 8}" text-anchor="middle">${dec}</text>`);
  }
  parts.push(`<rect x="${L}" y="${H - 6}" width="0" height="0"/>`);
  const svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Events recorded per decade, split by verified and not yet verified">${parts.join('')}</svg>`;
  return fig(
    svg,
    'Recorded events per decade',
    `Solid bars are VERIFIED entries; hatched bars are draft, needs-source or contested. ${undated} ${undated === 1 ? 'entry has' : 'entries have'} no recorded date and ${undated === 1 ? 'is' : 'are'} not counted. The chart shows what the notes record, not what happened.`,
    'chart-decades',
  );
}

function hbars(items: { label: string; value: number; to?: string }[], aria: string, unit: string): string {
  const row = 26;
  const L = 178;
  const H = items.length * row + 8;
  const max = Math.max(...items.map((i) => i.value), 1);
  const parts = items.map((it, i) => {
    const y = 4 + i * row;
    const w = ((W - L - 40) * it.value) / max;
    const label = `<text class="name" x="${L - 8}" y="${y + 15}" text-anchor="end">${esc(it.label.length > 24 ? it.label.slice(0, 23) + '…' : it.label)}</text>`;
    return `${it.to ? `<a href="${esc(it.to)}">${label}</a>` : label}<rect class="bar" x="${L}" y="${y + 3}" width="${Math.max(2, w)}" height="16"><title>${esc(it.label)}: ${it.value} ${unit}</title></rect><text class="val" x="${L + Math.max(2, w) + 6}" y="${y + 16}">${it.value}</text>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(aria)}">${parts.join('')}</svg>`;
}

export function connectionChart(d: Data): string {
  const items = d.people
    .map((p) => ({ label: p.name, value: d.degree(p.id), to: href('/people/' + p.id + '/') }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
    .slice(0, 12);
  return fig(
    hbars(items, 'People with the most connections', 'people'),
    'Most connected people',
    'Distinct other people linked by a cited relationship or by sharing a recorded event. Counts reflect how much the notes record, so well-documented people rank high.',
    'chart-connected',
  );
}

export function placeChart(d: Data): string {
  const items = d.ds.places
    .map((pl) => ({ label: pl.name, value: d.eventsAt(pl.id).length, to: href('/places/' + pl.id + '/') }))
    .filter((x) => x.value > 0)
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
    .slice(0, 10);
  return fig(hbars(items, 'Places with the most recorded events', 'events'), 'Busiest places', 'Events recorded at each named place. Events whose place is a pair of places or is not given are not counted.', 'chart-places');
}

export function spanChart(d: Data): string {
  const rows = d.people
    .map((p) => {
      const ys = d.eventsFor(p.id).map((e) => parseDate(e.date)).filter(Boolean).flatMap((x) => [x!.y0, x!.y1]);
      return { p, a: Math.min(...ys), b: Math.max(...ys), n: ys.length / 2 };
    })
    .filter((r) => isFinite(r.a) && r.b > r.a)
    .sort((x, y) => x.a - y.a)
    .slice(0, 30);
  const row = 20;
  const L = 178;
  const T = 6;
  const B = 26;
  const H = T + rows.length * row + B;
  const min = Math.floor(Math.min(...rows.map((r) => r.a)) / 10) * 10;
  const max = Math.ceil(Math.max(...rows.map((r) => r.b)) / 10) * 10;
  const x = (v: number) => L + ((v - min) / (max - min)) * (W - L - 10);
  const parts: string[] = [];
  for (let t = Math.ceil(min / 50) * 50; t <= max; t += 50) {
    parts.push(`<line class="grid" x1="${x(t)}" x2="${x(t)}" y1="${T}" y2="${H - B}"/><text x="${x(t)}" y="${H - 8}" text-anchor="middle">${t}</text>`);
  }
  rows.forEach((r, i) => {
    const y = T + i * row;
    parts.push(
      `<a href="${esc(href('/people/' + r.p.id + '/'))}"><text class="name" x="${L - 8}" y="${y + 14}" text-anchor="end" style="font-size:12px">${esc(r.p.short ?? r.p.name)}</text></a><rect class="bar alt" x="${x(r.a)}" y="${y + 4}" width="${Math.max(3, x(r.b) - x(r.a))}" height="10"><title>${esc(r.p.name)}: events from ${r.a} to ${r.b}</title></rect>`,
    );
  });
  return fig(
    `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Span of years covered by each person's recorded events">${parts.join('')}</svg>`,
    'Years covered by each person’s recorded events',
    'From a person’s first to last dated event in the notes. This is not a lifespan: people appear only for the moments the book records. Up to 30 people, by start year, are shown.',
    'chart-spans',
  );
}

export function allCharts(d: Data): string[] {
  return [decadeChart(d), connectionChart(d), placeChart(d), spanChart(d)];
}
