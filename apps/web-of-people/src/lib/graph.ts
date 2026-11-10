import { drag } from 'd3-drag';
import { forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY, type Simulation, type SimulationLinkDatum, type SimulationNodeDatum } from 'd3-force';
import { select, type Selection } from 'd3-selection';
import { zoom, zoomIdentity, zoomTransform, type ZoomBehavior } from 'd3-zoom';
import type { Data } from './data';
import { FAMILY_TYPES, initials } from './data';
import { esc, href, personPill, portraitSrc } from './html';
import { profileHtml } from './profile';
import { initTimeline } from './timeline';

export interface GNode extends SimulationNodeDatum {
  id: string;
  kind: 'person' | 'place';
  label: string;
  r: number;
  deg: number;
  year: number | null;
  phase: number;
  src?: string | null;
  init?: string;
  hw?: number;
  sub?: string;
}

export interface GLink extends SimulationLinkDatum<GNode> {
  type: string;
  dist: number;
  str: number;
  id: string;
}

export interface WebOptions {
  data: Data;
  initial?: string | null;
  syncUrl?: boolean;
}

export interface WebHandle {
  select(id: string | null, center?: boolean): void;
  fit(): void;
  destroy(): void;
}

function hubPeople(d: Data) {
  const m = new Map<string, Set<string>>();
  for (const e of d.events) {
    if (!e.place || !d.placeById.has(e.place)) continue;
    if (!m.has(e.place)) m.set(e.place, new Set());
    for (const p of e.people) m.get(e.place)!.add(p);
  }
  return m;
}

export function buildGraph(d: Data, o: { shared: boolean; places: boolean; mobile: boolean }) {
  const scale = o.mobile ? 0.8 : 1;
  const nodes: GNode[] = d.people.map((p, i) => {
    const deg = d.degree(p.id);
    return {
      id: p.id,
      kind: 'person',
      label: p.short ?? p.name,
      r: Math.max(21, Math.min(38, 18 + 4.5 * Math.sqrt(deg))) * scale,
      deg,
      year: d.firstYear(p.id),
      phase: (i * 2.399963) % (Math.PI * 2),
      src: portraitSrc(p),
      init: initials(p.name),
    };
  });
  const links: GLink[] = [];
  const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);
  const related = new Set<string>();
  for (const r of d.relationships) {
    if (!r.b) continue;
    related.add(pairKey(r.a, r.b));
    const fam = FAMILY_TYPES.includes(r.type);
    links.push({
      id: r.id,
      source: r.a,
      target: r.b,
      type: fam ? 'family' : r.type,
      dist: (fam ? 58 : r.type === 'partners' ? 84 : r.type === 'conflict' ? 115 : 98) * scale,
      str: fam ? 0.9 : 0.5,
    });
  }
  if (o.shared) {
    const agg = new Map<string, { a: string; b: string; n: number }>();
    for (const e of d.events) {
      const ps = [...new Set(e.people)];
      if (ps.length < 2 || ps.length > 8) continue;
      for (let i = 0; i < ps.length; i++)
        for (let j = i + 1; j < ps.length; j++) {
          const k = pairKey(ps[i], ps[j]);
          if (related.has(k)) continue;
          const cur = agg.get(k) ?? { a: ps[i], b: ps[j], n: 0 };
          cur.n++;
          agg.set(k, cur);
        }
    }
    for (const [k, v] of agg) links.push({ id: 'sh-' + k, source: v.a, target: v.b, type: 'shared', dist: 130 * scale, str: 0.18 });
  }
  if (o.places) {
    for (const [pid, people] of hubPeople(d)) {
      if (people.size < 3) continue;
      const pl = d.placeById.get(pid)!;
      const yrs = [...people].map((id) => d.firstYear(id)).filter((y): y is number => y != null);
      const label = pl.name.length > 22 ? pl.name.slice(0, 21) + '…' : pl.name;
      nodes.push({
        id: 'place:' + pid,
        kind: 'place',
        label,
        r: 14,
        deg: people.size,
        year: yrs.length ? yrs.reduce((a, b) => a + b, 0) / yrs.length : null,
        phase: (nodes.length * 2.399963) % (Math.PI * 2),
        hw: Math.max(34, label.length * 3.6 + 12),
        sub: `${people.size} people`,
      });
      for (const id of people) links.push({ id: `pl-${pid}-${id}`, source: id, target: 'place:' + pid, type: 'placelink', dist: 130 * scale, str: 0.05 });
    }
  }
  return { nodes, links };
}

export function placePanelHtml(d: Data, placeId: string): string {
  const open = d.local ? '' : `<p><a class="btn" href="${esc(href('/places/' + placeId + '/'))}">Open place page</a></p>`;
  const pl = d.placeById.get(placeId)!;
  const evs = d.eventsAt(placeId);
  const people = d.peopleAt(placeId);
  return `<article class="profile"><header class="profile-head"><span class="portrait none" aria-hidden="true"><span class="init">PL</span></span><div><p class="eyebrow">Place · ${evs.length} recorded event${evs.length === 1 ? '' : 's'}</p><h2>${esc(pl.name)}</h2></div></header>
  <section><h3>People recorded here</h3><ul class="pill-list">${people.map((p) => personPill(p)).join('')}</ul></section>
  ${open}</article>`;
}

export function mountWeb(root: HTMLElement, opts: WebOptions): WebHandle {
  const d = opts.data;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const state = { time: false, shared: true, places: true, selected: null as string | null, term: '' };
  let mobile = matchMedia('(max-width: 720px)').matches;

  root.innerHTML = `
    <div class="toolbar" role="search">
      <label class="field"><span class="sr">Find a person</span><input type="search" data-q placeholder="Find a person" list="wp-names" autocomplete="off"></label>
      <datalist id="wp-names">${d.people.map((p) => `<option value="${esc(p.name)}"></option>`).join('')}</datalist>
      <label class="tog"><input type="checkbox" data-t="time"> Arrange by time</label>
      <label class="tog"><input type="checkbox" data-t="shared" checked> Shared-event links</label>
      <label class="tog"><input type="checkbox" data-t="places" checked> Place hubs</label>
    </div>
    <div class="webwrap">
      <div class="stage">
        <svg class="web" role="group" aria-label="Web of people. Drag a bubble to move it, scroll or pinch to zoom, press Enter on a bubble to open its profile."><g class="zl"><g class="links"></g><g class="hubs"></g><g class="nodes"></g></g></svg>
        <div class="zoomctl">
          <button type="button" class="btn" data-z="in" aria-label="Zoom in">+</button>
          <button type="button" class="btn" data-z="out" aria-label="Zoom out">−</button>
          <button type="button" class="btn" data-z="fit" aria-label="Fit everything in view">Fit</button>
        </div>
        <div class="tip" role="tooltip"></div>
        <p class="empty-note">Bubbles are people from the Cardinal notes. A dashed ring means no verified portrait: initials instead.</p>
      </div>
      <aside class="drawer" aria-label="Profile" aria-hidden="true">
        <div class="drawer-grip" aria-hidden="true"></div>
        <div class="drawer-bar"><a class="btn" data-full href="#">Open full page</a><button type="button" class="btn" data-close>Close</button></div>
        <div class="drawer-body" tabindex="-1"></div>
      </aside>
    </div>
    <ul class="legend" aria-label="Legend">
      <li><svg viewBox="0 0 36 8"><path d="M0 4H36" style="stroke:var(--ink);stroke-width:3"/></svg> Family</li>
      <li><svg viewBox="0 0 36 8"><path d="M0 4H36" style="stroke-width:2"/></svg> Partners or employer</li>
      <li><svg viewBox="0 0 36 8"><path d="M0 4H36" style="stroke-width:2;stroke-dasharray:7 5"/></svg> Mentor or recruited</li>
      <li><svg viewBox="0 0 36 8"><path d="M0 4H36" style="stroke:var(--ink);stroke-width:2;stroke-dasharray:2 6;stroke-linecap:round"/></svg> Conflict</li>
      <li><svg viewBox="0 0 36 8"><path d="M0 4H36" style="stroke-width:1;stroke-dasharray:1 5;stroke-linecap:round"/></svg> Same recorded event</li>
      <li>Bubble size = number of people connected</li>
    </ul>`;

  const stage = root.querySelector<HTMLElement>('.stage')!;
  const svg = select<SVGSVGElement, unknown>(root.querySelector<SVGSVGElement>('svg.web')!);
  const zl = svg.select<SVGGElement>('g.zl');
  const tip = root.querySelector<HTMLElement>('.tip')!;
  const drawer = root.querySelector<HTMLElement>('.drawer')!;
  const drawerBody = drawer.querySelector<HTMLElement>('.drawer-body')!;
  const fullLink = drawer.querySelector<HTMLAnchorElement>('[data-full]')!;
  const searchBox = root.querySelector<HTMLInputElement>('[data-q]')!;

  let nodes: GNode[] = [];
  let links: GLink[] = [];
  let sim: Simulation<GNode, GLink>;
  let zb: ZoomBehavior<SVGSVGElement, unknown>;
  let adj = new Map<string, Set<string>>();
  let userZoomed = false;
  let lastFocus: Element | null = null;
  let tick = 0;

  const nodeSel = () => zl.select('g.nodes').selectAll<SVGGElement, GNode>('g.node');
  const hubSel = () => zl.select('g.hubs').selectAll<SVGGElement, GNode>('g.hub');
  const linkSel = () => zl.select('g.links').selectAll<SVGLineElement, GLink>('line.link');
  const allItems = () => zl.selectAll<SVGGElement, GNode>('g.node, g.hub');

  function size() {
    const r = stage.getBoundingClientRect();
    return { w: r.width || 800, h: r.height || 600 };
  }

  function aspect() {
    const { w, h } = size();
    return Math.max(0.7, Math.min(2, h / w));
  }

  function targetX(n: GNode, w: number): number {
    if (!state.time || n.year == null) return 0;
    const t = (n.year - 1760) / (2025 - 1760);
    return (t - 0.5) * w * 1.7;
  }

  function build(keepPositions: boolean) {
    const old = new Map(nodes.map((n) => [n.id, n]));
    const g = buildGraph(d, { shared: state.shared, places: state.places, mobile });
    nodes = g.nodes;
    links = g.links;
    nodes.forEach((n, i) => {
      const o = old.get(n.id);
      if (keepPositions && o) {
        n.x = o.x;
        n.y = o.y;
      } else {
        const a = i * 2.399963;
        const rad = 30 + 16 * Math.sqrt(i);
        n.x = Math.cos(a) * rad;
        n.y = Math.sin(a) * rad;
      }
    });
    adj = new Map();
    for (const l of links) {
      const a = l.source as string;
      const b = l.target as string;
      if (!adj.has(a)) adj.set(a, new Set());
      if (!adj.has(b)) adj.set(b, new Set());
      adj.get(a)!.add(b);
      adj.get(b)!.add(a);
    }

    zl.select('g.links').selectAll('*').remove();
    zl.select('g.hubs').selectAll('*').remove();
    zl.select('g.nodes').selectAll('*').remove();

    zl.select('g.links')
      .selectAll<SVGLineElement, GLink>('line')
      .data(links, (l: any) => l.id)
      .join('line')
      .attr('class', (l) => `link ${l.type}`);

    const people = nodes.filter((n) => n.kind === 'person');
    const hubs = nodes.filter((n) => n.kind === 'place');

    const hs = zl
      .select('g.hubs')
      .selectAll<SVGGElement, GNode>('g')
      .data(hubs, (n) => n.id)
      .join('g')
      .attr('class', 'hub')
      .attr('tabindex', 0)
      .attr('role', 'button')
      .attr('aria-label', (n) => `Place: ${n.label}. Press Enter to see who is recorded here.`);
    hs.append('rect')
      .attr('x', (n) => -n.hw!)
      .attr('y', -12)
      .attr('width', (n) => n.hw! * 2)
      .attr('height', 24);
    hs.append('text').attr('text-anchor', 'middle').attr('dy', '0.35em').text((n) => n.label.toUpperCase());

    const ns = zl
      .select('g.nodes')
      .selectAll<SVGGElement, GNode>('g')
      .data(people, (n) => n.id)
      .join('g')
      .attr('class', 'node')
      .attr('tabindex', 0)
      .attr('role', 'button')
      .attr('aria-label', (n) => {
        const p = d.byId.get(n.id)!;
        return `${p.name}${p.role ? ', ' + p.role : ''}. Press Enter to open profile.`;
      });
    ns.each(function (n, i) {
      const g = select(this);
      const clip = `wp-clip-${i}`;
      g.append('circle').attr('class', n.src ? 'ring' : 'ring none').attr('r', n.r);
      if (n.src) {
        g.append('clipPath').attr('id', clip).append('circle').attr('r', n.r - 1);
        g.append('image')
          .attr('href', n.src)
          .attr('x', -n.r)
          .attr('y', -n.r)
          .attr('width', n.r * 2)
          .attr('height', n.r * 2)
          .attr('preserveAspectRatio', 'xMidYMin slice')
          .attr('clip-path', `url(#${clip})`)
          .style('pointer-events', 'none');
        g.append('circle').attr('class', 'ring').attr('r', n.r).style('fill', 'none').style('pointer-events', 'none');
      } else {
        g.append('text').attr('class', 'init').style('font-size', `${Math.round(n.r * 0.62)}px`).text(n.init!);
      }
      g.append('text').attr('class', 'lab').attr('y', n.r + 14).style('font-size', '12px').text(n.label);
    });

    const dragB = drag<SVGGElement, GNode>()
      .clickDistance(5)
      .on('start', (e, n) => {
        if (!e.active) sim.alphaTarget(0.25).restart();
        n.fx = n.x;
        n.fy = n.y;
        tip.classList.remove('on');
      })
      .on('drag', (e, n) => {
        n.fx = e.x;
        n.fy = e.y;
      })
      .on('end', (e, n) => {
        if (!e.active) sim.alphaTarget(idleTarget());
        n.fx = null;
        n.fy = null;
      });
    allItems().call(dragB);

    allItems()
      .on('click', (_e, n) => choose(n.id, false))
      .on('keydown', (e: KeyboardEvent, n) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          choose(n.id, false);
        }
      })
      .on('pointerenter', (e: PointerEvent, n) => {
        if (e.pointerType === 'touch') return;
        hover(n);
      })
      .on('pointerleave', () => unhover())
      .on('focus', (_e, n) => hover(n))
      .on('blur', () => unhover());

    sim?.stop();
    sim = forceSimulation<GNode>(nodes)
      .force('link', forceLink<GNode, GLink>(links).id((n) => n.id).distance((l) => l.dist).strength((l) => l.str))
      .force('charge', forceManyBody<GNode>().strength((n) => (n.kind === 'place' ? -110 : -70 - n.r * 3.5)))
      .force('collide', forceCollide<GNode>((n) => (n.kind === 'place' ? n.hw! + 2 : n.r + 8)).strength(0.9))
      .force('x', forceX<GNode>((n) => targetX(n, size().w)).strength(state.time ? 0.28 : 0.09 * aspect() ** 1.5))
      .force('y', forceY<GNode>(0).strength(state.time ? 0.08 : 0.11 / aspect() ** 1.5))
      .force('drift', () => {
        if (reduced) return;
        tick++;
        for (const n of nodes) {
          n.vx = (n.vx ?? 0) + Math.sin(tick * 0.013 + n.phase) * 0.045;
          n.vy = (n.vy ?? 0) + Math.cos(tick * 0.011 + n.phase * 1.3) * 0.045;
        }
      })
      .alphaDecay(0.035)
      .velocityDecay(0.42)
      .on('tick', paint);

    sim.stop();
    for (let i = 0; i < 260; i++) sim.tick();
    paint();
    if (!reduced) sim.alpha(0.2).alphaTarget(idleTarget()).restart();
    applyClasses();
  }

  function idleTarget() {
    return reduced || document.hidden ? 0 : 0.015;
  }

  function paint() {
    linkSel()
      .attr('x1', (l) => (l.source as GNode).x!)
      .attr('y1', (l) => (l.source as GNode).y!)
      .attr('x2', (l) => (l.target as GNode).x!)
      .attr('y2', (l) => (l.target as GNode).y!);
    allItems().attr('transform', (n) => `translate(${n.x},${n.y})`);
  }

  function neighbours(id: string): Set<string> {
    const s = new Set<string>([id]);
    for (const x of adj.get(id) ?? []) s.add(x);
    return s;
  }

  let hovered: string | null = null;
  function applyClasses() {
    const focusId = hovered ?? state.selected;
    const nb = focusId ? neighbours(focusId) : null;
    const term = state.term;
    allItems()
      .classed('is-sel', (n) => n.id === state.selected || n.id === 'place:' + state.selected)
      .classed('is-dim', (n) => (nb ? !nb.has(n.id) : false) || (!!term && !matches(n)))
      .classed('is-match', (n) => !!term && matches(n));
    linkSel().classed('is-dim', (l) => {
      if (!nb) return !!term;
      return !(nb.has((l.source as GNode).id) && nb.has((l.target as GNode).id) && ((l.source as GNode).id === focusId || (l.target as GNode).id === focusId));
    });
    labelVis();
  }

  function matches(n: GNode) {
    return n.label.toLowerCase().includes(state.term) || (n.kind === 'person' && d.byId.get(n.id)!.name.toLowerCase().includes(state.term));
  }

  function labelVis() {
    const k = zoomTransform(svg.node()!).k;
    nodeSel().classed('lab-hide', (n) => k * n.r < (mobile ? 15 : 13));
  }

  function hover(n: GNode) {
    hovered = n.id;
    const t = zoomTransform(svg.node()!);
    const p = n.kind === 'person' ? d.byId.get(n.id)! : null;
    tip.innerHTML = p
      ? `<b>${esc(p.name)}</b>${esc(p.role ?? 'Role not recorded')}<br><span class="dim">${esc(d.lifeLabel(p.id))} · ${n.deg} connection${n.deg === 1 ? '' : 's'}</span>`
      : `<b>${esc(n.label)}</b><span class="dim">${esc(n.sub ?? '')}</span>`;
    const sx = t.applyX(n.x!);
    const sy = t.applyY(n.y!);
    const { w } = size();
    tip.style.left = `${Math.min(w - 260, Math.max(8, sx + (n.r ?? 14) * t.k + 10))}px`;
    tip.style.top = `${Math.max(8, sy - 24)}px`;
    tip.classList.add('on');
    applyClasses();
  }
  function unhover() {
    hovered = null;
    tip.classList.remove('on');
    applyClasses();
  }

  function setZoom() {
    zb = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.25, 4])
      .filter((e: Event) => !(e as MouseEvent).ctrlKey || e.type === 'wheel')
      .on('zoom', (e) => {
        zl.attr('transform', e.transform.toString());
        if (e.sourceEvent) userZoomed = true;
        labelVis();
      });
    svg.call(zb).on('dblclick.zoom', null);
  }

  function fit() {
    const { w, h } = size();
    const items = nodes.filter((n) => n.x != null);
    if (!items.length) return;
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const n of items) {
      const r = n.kind === 'place' ? n.hw! : n.r + 6;
      x0 = Math.min(x0, n.x! - r);
      x1 = Math.max(x1, n.x! + r);
      y0 = Math.min(y0, n.y! - n.r - 4);
      y1 = Math.max(y1, n.y! + n.r + 20);
    }
    const k = Math.min(2, 0.92 * Math.min(w / (x1 - x0), h / (y1 - y0)));
    const t = zoomIdentity.translate(w / 2 - (k * (x0 + x1)) / 2, h / 2 - (k * (y0 + y1)) / 2).scale(k);
    svg.call(zb.transform, t);
    userZoomed = false;
  }

  function centerOn(id: string) {
    const n = nodes.find((x) => x.id === id);
    if (!n) return;
    const { w, h } = size();
    const t = zoomTransform(svg.node()!);
    const k = Math.max(t.k, mobile ? 0.9 : 1);
    const free = mobile ? { x: w / 2, y: h * 0.35 } : { x: Math.max(160, (w - Math.min(480, w)) / 2), y: h / 2 };
    svg.call(zb.transform, zoomIdentity.translate(free.x - k * n.x!, free.y - k * n.y!).scale(k));
    userZoomed = true;
  }

  function open(html: string, full: string) {
    drawerBody.innerHTML = html;
    fullLink.href = full;
    fullLink.hidden = d.local;
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    drawerBody.scrollTop = 0;
    initTimeline(drawerBody, d);
  }

  function choose(id: string, center: boolean) {
    const n = nodes.find((x) => x.id === id);
    if (!n) return;
    lastFocus = document.activeElement;
    state.selected = n.kind === 'place' ? id.slice(6) : id;
    if (n.kind === 'person') open(profileHtml(d, id, { heading: 'h2' }), href('/people/' + id + '/'));
    else open(placePanelHtml(d, id.slice(6)), href('/places/' + id.slice(6) + '/'));
    if (center) centerOn(id);
    if (opts.syncUrl !== false) {
      const u = new URL(location.href);
      u.searchParams.set('p', id);
      history.replaceState(null, '', u);
    }
    applyClasses();
    drawerBody.focus({ preventScroll: true });
  }

  function close() {
    state.selected = null;
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    if (opts.syncUrl !== false) {
      const u = new URL(location.href);
      u.searchParams.delete('p');
      history.replaceState(null, '', u);
    }
    applyClasses();
    if (lastFocus instanceof HTMLElement) lastFocus.focus({ preventScroll: true });
  }

  drawer.querySelector('[data-close]')!.addEventListener('click', close);
  drawerBody.addEventListener('click', (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('a[data-person]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    choose(a.dataset.person!, true);
  });
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) close();
  };
  document.addEventListener('keydown', onKey);

  root.querySelectorAll<HTMLButtonElement>('[data-z]').forEach((b) =>
    b.addEventListener('click', () => {
      const k = b.dataset.z;
      if (k === 'fit') return fit();
      svg.call(zb.scaleBy, k === 'in' ? 1.4 : 1 / 1.4);
      userZoomed = true;
    }),
  );

  root.querySelectorAll<HTMLInputElement>('[data-t]').forEach((c) =>
    c.addEventListener('change', () => {
      (state as any)[c.dataset.t!] = c.checked;
      build(true);
      if (!userZoomed || c.dataset.t === 'time') fit();
    }),
  );

  searchBox.addEventListener('input', () => {
    state.term = searchBox.value.trim().toLowerCase();
    applyClasses();
  });
  searchBox.addEventListener('change', () => {
    const term = searchBox.value.trim().toLowerCase();
    if (!term) return;
    const hit = d.people.find((p) => p.name.toLowerCase() === term) ?? d.people.find((p) => p.name.toLowerCase().includes(term));
    if (hit) choose(hit.id, true);
  });
  searchBox.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') searchBox.dispatchEvent(new Event('change'));
  });

  const onVis = () => {
    if (!sim) return;
    sim.alphaTarget(idleTarget());
    if (document.hidden) sim.stop();
    else if (!reduced) sim.restart();
  };
  document.addEventListener('visibilitychange', onVis);

  let rz = 0;
  const ro = new ResizeObserver(() => {
    cancelAnimationFrame(rz);
    rz = requestAnimationFrame(() => {
      const m = matchMedia('(max-width: 720px)').matches;
      if (m !== mobile) {
        mobile = m;
        build(true);
      }
      if (!userZoomed) fit();
    });
  });
  ro.observe(stage);

  setZoom();
  build(false);
  fit();
  const start = 'initial' in opts ? opts.initial : new URL(location.href).searchParams.get('p');
  if (start && (d.byId.has(start) || start.startsWith('place:'))) choose(start, true);

  return {
    select: (id, center = true) => (id ? choose(id, center) : close()),
    fit: () => fit(),
    destroy() {
      sim?.stop();
      ro.disconnect();
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('visibilitychange', onVis);
    },
  };
}

