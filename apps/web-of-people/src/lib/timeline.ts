import type { Data } from './data';
import type { EventRec } from './types';
import { formatDate, parseDate } from './dates';
import { STATUS_CLASS, STATUS_LABEL, citeHtml, esc, href, statusBadge } from './html';

const PAD = 16;
const SLOT = 17;
const SLOTS = 4;
const LANE_H = 86;

interface AxisOpts {
  width?: number;
  win?: { min: number; max: number } | null;
  selected?: string | null;
  hidden?: Set<string>;
}

function niceStep(span: number): number {
  for (const s of [1, 2, 5, 10, 20, 25, 50, 100, 200]) if (span / s <= 9) return s;
  return 500;
}

export function fullRange(d: Data, lanes: string[]): { min: number; max: number } {
  let min = Infinity;
  let max = -Infinity;
  for (const id of lanes) {
    for (const e of d.eventsFor(id)) {
      const p = parseDate(e.date);
      if (!p) continue;
      min = Math.min(min, p.start);
      max = Math.max(max, p.end);
    }
  }
  if (!isFinite(min)) return { min: 1900, max: 2000 };
  const pad = Math.max(1, (max - min) * 0.04);
  return { min: Math.floor(min - pad), max: Math.ceil(max + pad) };
}

export function axisSvg(d: Data, lanes: string[], o: AxisOpts = {}): string {
  const W = o.width ?? 960;
  const range = o.win ?? fullRange(d, lanes);
  const span = Math.max(1, range.max - range.min);
  const x = (v: number) => PAD + ((v - range.min) / span) * (W - PAD * 2);
  const multi = lanes.length > 1;
  const top = multi ? 18 : 6;
  const h = top + lanes.length * LANE_H + 26;
  const step = niceStep(span);
  const parts: string[] = [];

  for (let t = Math.ceil(range.min / step) * step; t <= range.max; t += step) {
    parts.push(
      `<g class="tick"><line class="ax" x1="${x(t).toFixed(1)}" x2="${x(t).toFixed(1)}" y1="${top - 4}" y2="${h - 20}" opacity=".35"/><text x="${x(t).toFixed(1)}" y="${h - 4}" text-anchor="middle">${t}</text></g>`,
    );
  }

  lanes.forEach((id, i) => {
    const laneTop = top + i * LANE_H;
    const person = d.byId.get(id)!;
    if (multi) {
      parts.push(`<text class="lane-label" x="${PAD}" y="${laneTop - 5}">${esc(person.short ?? person.name)}</text>`);
    }
    parts.push(`<line class="lane" x1="${PAD}" x2="${W - PAD}" y1="${laneTop + LANE_H - 4}" y2="${laneTop + LANE_H - 4}"/>`);
    const last: number[] = Array(SLOTS).fill(-99);
    let rot = 0;
    for (const e of d.eventsFor(id)) {
      const p = parseDate(e.date);
      if (!p) continue;
      const x0 = x(p.start);
      const x1 = x(p.end);
      if (x1 < PAD - 2 || x0 > W - PAD + 2) continue;
      const hidden = o.hidden?.has(e.id);
      const range = p.precision === 'range' && p.y1 > p.y0;
      const left = Math.max(PAD, x0);
      const right = Math.min(W - PAD, x1);
      let slot = last.findIndex((l) => l + 16 <= left);
      if (slot < 0) slot = rot++ % SLOTS;
      last[slot] = range ? right : left;
      const cy = laneTop + 14 + slot * SLOT;
      const on = o.selected === e.id ? ' is-on' : '';
      const label = `${formatDate(e.date)}: ${e.title} (${STATUS_LABEL[e.status]})`;
      const common = `data-ev="${esc(e.id)}" tabindex="0" role="button" aria-label="${esc(label)}"${hidden ? ' opacity=".12"' : ''}`;
      if (range) {
        parts.push(
          `<rect class="bar${on}" ${common} x="${left.toFixed(1)}" y="${cy - 5}" width="${Math.max(7, right - left).toFixed(1)}" height="10" rx="0"><title>${esc(label)}</title></rect>`,
        );
      } else {
        parts.push(
          `<circle class="pt ${STATUS_CLASS[e.status]}${on}" ${common} cx="${Math.min(W - PAD, Math.max(PAD, x0 + (p.precision === 'year' ? ((x1 - x0) / 2) : 0))).toFixed(1)}" cy="${cy}" r="7"><title>${esc(label)}</title></circle>`,
        );
      }
    }
  });
  parts.unshift(`<line class="ax" x1="${PAD}" x2="${W - PAD}" y1="${h - 20}" y2="${h - 20}"/>`);

  return `<svg class="tl-axis" width="${W}" height="${h}" viewBox="0 0 ${W} ${h}" role="group" aria-label="Timeline axis. Each mark is an event; press Enter on a mark to select it.">${parts.join('')}</svg>`;
}

function key(): string {
  const sw = (cls: string, fill: string, extra = '') =>
    `<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6" fill="${fill}" stroke="${cls === 'x' ? 'none' : 'currentColor'}" stroke-width="2" ${extra}/></svg>`;
  return `<div class="tl-key" aria-label="Key">
    <span>${sw('v', 'currentColor')} Verified</span>
    <span>${sw('d', 'none')} Draft note</span>
    <span>${sw('n', 'none', 'stroke-dasharray="2 2"')} Needs source</span>
    <span><svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6" fill="var(--cardinal)" stroke="currentColor" stroke-width="2"/></svg> Contested</span>
    <span><svg viewBox="0 0 28 16" aria-hidden="true" style="width:1.6rem"><rect x="1" y="4" width="26" height="8" fill="currentColor" opacity=".55"/></svg> A span of years</span>
  </div>`;
}

export function eventItem(d: Data, e: EventRec, selfId: string): string {
  const place = e.place ? d.placeById.get(e.place) : undefined;
  const others = e.people.filter((p) => p !== selfId).map((p) => d.byId.get(p)).filter(Boolean);
  const text = [e.title, e.why ?? '', place?.name ?? e.locationText ?? '', others.map((o) => o!.name).join(' ')].join(' ').toLowerCase();
  const dated = !!parseDate(e.date);
  const dateLine = dated
    ? `${esc(formatDate(e.date))}${e.dateNote ? `<small>${esc(e.dateNote)}</small>` : ''}`
    : `<span class="not-recorded">Date not recorded</span>${e.dateNote ? `<small>${esc(e.dateNote)}</small>` : ''}`;
  const placeHtml = place && !d.local
    ? `<a href="${esc(href('/places/' + place.id + '/'))}">${esc(place.name)}</a>`
    : (place?.name ?? e.locationText)
      ? esc(place?.name ?? e.locationText)
      : '';
  const withHtml = others.length
    ? `<p class="ev-with"><span class="dim">With:</span> ${others.map((o) => `<a href="${esc(href('/people/' + o!.id + '/'))}" data-person="${esc(o!.id)}">${esc(o!.short ?? o!.name)}</a>`).join(', ')}</p>`
    : '';
  const sub = [placeHtml, e.why ? esc(e.why) : ''].filter(Boolean).join(' · ');
  return `<li class="ev" id="ev-${esc(e.id)}" data-ev="${esc(e.id)}" data-status="${esc(e.status)}" data-text="${esc(text)}">
    <div class="ev-date">${dateLine}</div>
    <div class="ev-main">
      <div class="ev-title">${esc(e.title)} ${statusBadge(e.status)}</div>
      ${sub ? `<p class="ev-sub">${sub}</p>` : ''}
      ${e.note ? `<p class="ev-sub">${esc(e.note)}</p>` : ''}
      ${withHtml}
      <details><summary>Source${e.cites.length === 1 ? '' : 's'} (${e.cites.length})</summary>${e.cites.map(citeHtml).join('')}</details>
    </div>
  </li>`;
}

export function timelineHtml(d: Data, personId: string): string {
  const evs = d.eventsFor(personId);
  const dated = evs.filter((e) => parseDate(e.date)).length;
  const undated = evs.length - dated;
  const laneOpts = [...d.connected(personId).keys()]
    .map((id) => d.byId.get(id)!)
    .filter((p) => d.eventsFor(p.id).some((e) => parseDate(e.date)))
    .sort((a, b) => a.name.localeCompare(b.name));
  if (!evs.length) {
    return `<div class="tl"><p class="not-recorded">No dated events for this person are recorded in the repository notes.</p></div>`;
  }
  return `<div class="tl" data-tl data-person="${esc(personId)}">
    <div class="tl-controls" role="group" aria-label="Timeline controls">
      <input type="search" data-tl-q placeholder="Search this timeline" aria-label="Search this timeline">
      <select data-tl-status aria-label="Filter by status">
        <option value="">All statuses</option>
        <option value="VERIFIED">Verified only</option>
        <option value="NOT">Not yet verified</option>
      </select>
      <button type="button" class="btn" data-tl-zoom="out" aria-label="Zoom out">Zoom −</button>
      <button type="button" class="btn" data-tl-zoom="in" aria-label="Zoom in">Zoom +</button>
      <button type="button" class="btn" data-tl-zoom="left" aria-label="Pan earlier">◀</button>
      <button type="button" class="btn" data-tl-zoom="right" aria-label="Pan later">▶</button>
      <button type="button" class="btn" data-tl-zoom="all">All years</button>
      ${
        laneOpts.length
          ? `<select data-tl-lane aria-label="Compare with a connected person"><option value="">Compare with…</option>${laneOpts.map((p) => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('')}</select>`
          : ''
      }
    </div>
    <div data-tl-axis${dated ? ' data-has="1"' : ''}>${dated ? axisSvg(d, [personId]) : ''}</div>
    ${key()}
    <p class="tl-detail" data-tl-detail aria-live="polite">Select a mark or an entry to see its sources.${undated ? ` ${undated} ${undated === 1 ? 'entry has no recorded date and appears' : 'entries have no recorded date and appear'} only in the list.` : ''}</p>
    <ol class="tl-list" data-tl-list>${evs.map((e) => eventItem(d, e, personId)).join('')}</ol>
    <p class="tl-empty" data-tl-empty hidden>No entries match.</p>
  </div>`;
}

export function initTimeline(root: HTMLElement, d: Data): void {
  const host = root.querySelector<HTMLElement>('[data-tl]');
  if (!host || (host as any)._tl) return;
  (host as any)._tl = true;
  const personId = host.dataset.person!;
  const axisHost = host.querySelector<HTMLElement>('[data-tl-axis]')!;
  const detail = host.querySelector<HTMLElement>('[data-tl-detail]')!;
  const q = host.querySelector<HTMLInputElement>('[data-tl-q]')!;
  const st = host.querySelector<HTMLSelectElement>('[data-tl-status]')!;
  const empty = host.querySelector<HTMLElement>('[data-tl-empty]')!;
  const items = [...host.querySelectorAll<HTMLElement>('.ev')];
  const state = { lanes: [personId], win: null as null | { min: number; max: number }, sel: null as string | null };
  const evById = new Map(d.events.map((e) => [e.id, e]));

  const hiddenSet = () => {
    const s = new Set<string>();
    for (const li of items) if (li.hidden) s.add(li.dataset.ev!);
    return s;
  };
  const axisWidth = () => Math.max(300, Math.min(960, Math.floor(axisHost.clientWidth || host.clientWidth || 960)));
  const draw = () => {
    if (axisHost.dataset.has) {
      axisHost.innerHTML = axisSvg(d, state.lanes, { win: state.win, selected: state.sel, hidden: hiddenSet(), width: axisWidth() });
    }
  };
  const apply = () => {
    const term = q.value.trim().toLowerCase();
    const s = st.value;
    let shown = 0;
    for (const li of items) {
      const okQ = !term || li.dataset.text!.includes(term);
      const okS = !s || (s === 'VERIFIED' ? li.dataset.status === 'VERIFIED' : li.dataset.status !== 'VERIFIED');
      li.hidden = !(okQ && okS);
      if (!li.hidden) shown++;
    }
    empty.hidden = shown > 0;
    draw();
  };
  const select = (id: string, scroll = true) => {
    state.sel = id;
    for (const li of items) li.classList.toggle('is-on', li.dataset.ev === id);
    const e = evById.get(id);
    if (e) {
      const who = e.people.map((p) => d.byId.get(p)?.short ?? d.byId.get(p)?.name).filter(Boolean).join(', ');
      detail.innerHTML = `<b>${esc(formatDate(e.date))}</b> · ${esc(e.title)} · ${statusBadge(e.status)}<br><span class="dim">${esc(who)}</span> ${e.cites.map(citeHtml).join('')}`;
    }
    const li = items.find((x) => x.dataset.ev === id);
    if (li && scroll && !li.hidden) li.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    draw();
  };

  let lastW = 0;
  new ResizeObserver(() => {
    const w = axisWidth();
    if (w !== lastW) {
      lastW = w;
      draw();
    }
  }).observe(host);
  q.addEventListener('input', apply);
  st.addEventListener('change', apply);

  host.querySelector<HTMLSelectElement>('[data-tl-lane]')?.addEventListener('change', (ev) => {
    const v = (ev.target as HTMLSelectElement).value;
    state.lanes = v ? [personId, v] : [personId];
    state.win = null;
    draw();
  });

  host.querySelectorAll<HTMLElement>('[data-tl-zoom]').forEach((b) =>
    b.addEventListener('click', () => {
      const full = fullRange(d, state.lanes);
      const cur = state.win ?? full;
      const span = cur.max - cur.min;
      const sel = state.sel ? parseDate(evById.get(state.sel)?.date) : null;
      const mid = sel && sel.start >= cur.min && sel.start <= cur.max ? sel.start : (cur.min + cur.max) / 2;
      const k = b.dataset.tlZoom;
      if (k === 'all') state.win = null;
      else if (k === 'in') {
        const ns = Math.max(4, span / 2);
        state.win = { min: Math.round(mid - ns / 2), max: Math.round(mid + ns / 2) };
      } else if (k === 'out') {
        const ns = span * 2;
        state.win = ns >= full.max - full.min ? null : { min: Math.round(mid - ns / 2), max: Math.round(mid + ns / 2) };
      } else {
        const sh = span * 0.4 * (k === 'left' ? -1 : 1);
        state.win = { min: Math.round(cur.min + sh), max: Math.round(cur.max + sh) };
      }
      draw();
    }),
  );

  axisHost.addEventListener('click', (e) => {
    const t = (e.target as Element).closest<SVGElement>('[data-ev]');
    if (t) select(t.getAttribute('data-ev')!);
  });
  axisHost.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const t = (e.target as Element).closest<SVGElement>('[data-ev]');
    if (!t) return;
    e.preventDefault();
    const id = t.getAttribute('data-ev')!;
    select(id);
    axisHost.querySelector<SVGElement>(`[data-ev="${CSS.escape(id)}"]`)?.focus();
  });
  host.querySelector('[data-tl-list]')!.addEventListener('click', (e) => {
    if ((e.target as Element).closest('a, summary, details')) return;
    const li = (e.target as Element).closest<HTMLElement>('.ev');
    if (li) select(li.dataset.ev!, false);
  });
}
