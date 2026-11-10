import type { Data } from './data';
import { initials } from './data';
import { yearOf } from './dates';
import { esc, href, portraitSrc } from './html';

const CW = 196;
const CH = 80;
const GAP = 26;
const COUPLE_GAP = 30;
const VGAP = 74;
const TOP = 34;
const MARGIN = 20;

interface TNode {
  id: string;
  ghost?: { label: string };
  gen: number;
  x: number;
  y: number;
}

interface Unit {
  members: string[];
  gen: number;
  x: number;
  w: number;
}

function clip(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

function lifeShort(d: Data, id: string): string {
  const b = yearOf(d.birth(id)?.date);
  const dd = yearOf(d.death(id)?.date);
  if (b && dd) return `${b}–${dd}`;
  if (b) return `b. ${b}`;
  if (dd) return `d. ${dd}`;
  return 'dates not recorded';
}

/** Lay a connected family component out as a descendant tree and return an SVG string. */
export function treeSvg(d: Data, comp: string[], focus?: string | null, uid = 't'): string {
  const ids = new Set(comp);
  const rels = d.relationships.filter((r) => ['spouse', 'parent', 'sibling'].includes(r.type) && (ids.has(r.a) || (r.b && ids.has(r.b))));
  const nodes = new Map<string, TNode>();
  for (const id of comp) nodes.set(id, { id, gen: 0, x: 0, y: 0 });
  const edges: { type: string; a: string; b: string }[] = [];
  for (const r of rels) {
    if (r.b) edges.push({ type: r.type, a: r.a, b: r.b });
    else {
      const gid = `ghost:${r.id}`;
      nodes.set(gid, { id: gid, ghost: { label: r.bLabel ?? 'Relative not named' }, gen: 0, x: 0, y: 0 });
      edges.push({ type: r.type, a: r.a, b: gid });
    }
  }

  for (let i = 0; i < 60; i++) {
    let changed = false;
    for (const e of edges) {
      const A = nodes.get(e.a)!;
      const B = nodes.get(e.b)!;
      if (e.type === 'parent' && B.gen < A.gen + 1) { B.gen = A.gen + 1; changed = true; }
      if (e.type !== 'parent' && A.gen !== B.gen) { A.gen = B.gen = Math.max(A.gen, B.gen); changed = true; }
    }
    if (!changed) break;
  }

  const parentsOf = new Map<string, string[]>();
  for (const e of edges) if (e.type === 'parent') {
    if (!parentsOf.has(e.b)) parentsOf.set(e.b, []);
    parentsOf.get(e.b)!.push(e.a);
  }

  const uf = new Map<string, string>();
  const find = (x: string): string => {
    let r = x;
    while (uf.get(r) !== r) r = uf.get(r)!;
    return r;
  };
  for (const n of nodes.keys()) uf.set(n, n);
  for (const e of edges) if (e.type === 'spouse') uf.set(find(e.a), find(e.b));
  const unitOf = new Map<string, Unit>();
  const units: Unit[] = [];
  for (const id of nodes.keys()) {
    const root = find(id);
    let u = [...unitOf.values()].find((x) => find(x.members[0]) === root);
    if (!u) {
      u = { members: [], gen: nodes.get(id)!.gen, x: 0, w: 0 };
      units.push(u);
    }
    u.members.push(id);
    unitOf.set(id, u);
  }
  for (const u of units) u.w = u.members.length * CW + (u.members.length - 1) * COUPLE_GAP;

  const childUnits = (u: Unit): Unit[] => {
    const out: Unit[] = [];
    for (const m of u.members) {
      for (const e of edges) {
        if (e.type === 'parent' && e.a === m) {
          const cu = unitOf.get(e.b)!;
          if (!out.includes(cu)) out.push(cu);
        }
      }
    }
    return out;
  };
  const hasParentUnit = (u: Unit) => u.members.some((m) => parentsOf.has(m));

  const placed = new Set<Unit>();
  let cursor = MARGIN;
  const subtreeW = new Map<Unit, number>();
  const measure = (u: Unit, seen = new Set<Unit>()): number => {
    if (subtreeW.has(u)) return subtreeW.get(u)!;
    if (seen.has(u)) return u.w;
    seen.add(u);
    const kids = childUnits(u).filter((k) => !hasPlacedParentElsewhere(k, u));
    const kw = kids.length ? kids.map((k) => measure(k, seen)).reduce((a, b) => a + b, 0) + (kids.length - 1) * GAP : 0;
    const w = Math.max(u.w, kw);
    subtreeW.set(u, w);
    return w;
  };
  const hasPlacedParentElsewhere = (k: Unit, u: Unit) => {
    const pus = new Set<Unit>();
    for (const m of k.members) for (const p of parentsOf.get(m) ?? []) pus.add(unitOf.get(p)!);
    return pus.size > 1 && [...pus][0] !== u;
  };
  const place = (u: Unit, left: number) => {
    if (placed.has(u)) return;
    placed.add(u);
    const w = measure(u);
    const kids = childUnits(u).filter((k) => !placed.has(k) && !hasPlacedParentElsewhere(k, u));
    u.x = left + (w - u.w) / 2;
    if (kids.length) {
      const kw = kids.map((k) => measure(k)).reduce((a, b) => a + b, 0) + (kids.length - 1) * GAP;
      let x = left + (w - kw) / 2;
      for (const k of kids) {
        place(k, x);
        x += measure(k) + GAP;
      }
    }
  };
  const roots = units.filter((u) => !hasParentUnit(u));
  for (const u of roots.length ? roots : units) {
    place(u, cursor);
    cursor += measure(u) + GAP * 1.6;
  }
  for (const u of units) if (!placed.has(u)) {
    place(u, cursor);
    cursor += measure(u) + GAP;
  }

  for (const u of units) {
    u.members.forEach((m, i) => {
      const n = nodes.get(m)!;
      n.x = u.x + i * (CW + COUPLE_GAP);
      n.y = TOP + n.gen * (CH + VGAP);
    });
  }
  const maxGen = Math.max(...[...nodes.values()].map((n) => n.gen));
  const W = Math.max(cursor - GAP * 1.6 + MARGIN, 2 * MARGIN + CW);
  const hasSib = edges.some((e) => e.type === 'sibling');
  const H = TOP + (maxGen + 1) * CH + maxGen * VGAP + MARGIN + (hasSib ? 4 : 0);

  const out: string[] = [];
  const defs: string[] = [];

  // Marriage lines
  for (const u of units) {
    if (u.members.length < 2) continue;
    for (let i = 0; i < u.members.length - 1; i++) {
      const a = nodes.get(u.members[i])!;
      const x1 = a.x + CW;
      out.push(`<line class="edge marriage" x1="${x1}" x2="${x1 + COUPLE_GAP}" y1="${a.y + CH / 2}" y2="${a.y + CH / 2}"/>`);
    }
  }

  // Parent -> child
  const drawn = new Set<string>();
  for (const [child, parents] of parentsOf) {
    const C = nodes.get(child)!;
    const cx = C.x + CW / 2;
    const byUnit = new Map<Unit, string[]>();
    for (const p of parents) {
      const pu = unitOf.get(p)!;
      if (!byUnit.has(pu)) byUnit.set(pu, []);
      byUnit.get(pu)!.push(p);
    }
    for (const [pu, ps] of byUnit) {
      let px: number;
      let py: number;
      if (ps.length >= 2 && pu.members.length >= 2) {
        const first = nodes.get(pu.members[0])!;
        px = pu.x + pu.w / 2;
        py = first.y + CH / 2;
        const key = `${pu.members.join('+')}>${child}`;
        if (drawn.has(key)) continue;
        drawn.add(key);
        const busY = nodes.get(ps[0])!.y + CH + VGAP / 2;
        out.push(`<path class="edge" d="M${px} ${py} V${busY} H${cx} V${C.y}"/>`);
      } else {
        for (const p of ps) {
          const P = nodes.get(p)!;
          px = P.x + CW / 2;
          const busY = P.y + CH + VGAP / 2;
          out.push(`<path class="edge" d="M${px} ${P.y + CH} V${busY} H${cx} V${C.y}"/>`);
        }
      }
    }
  }

  // Sibling brackets (only where neither sibling has parents drawn)
  const sibs = edges.filter((e) => e.type === 'sibling' && !parentsOf.has(e.a) && !parentsOf.has(e.b));
  for (const e of sibs) {
    const A = nodes.get(e.a)!;
    const B = nodes.get(e.b)!;
    const y = A.y - 16;
    const ax = A.x + CW / 2;
    const bx = B.x + CW / 2;
    out.push(`<path class="edge sib" d="M${ax} ${A.y} V${y} H${bx} V${B.y}"/>`);
  }

  // Generation labels
  for (let g = 0; g <= maxGen; g++) {
    out.push(`<text class="gen" x="${MARGIN}" y="${TOP + g * (CH + VGAP) - 20}">Generation ${g + 1}</text>`);
  }

  // Cards
  let k = 0;
  for (const n of nodes.values()) {
    const cx = n.x;
    const cy = n.y;
    if (n.ghost) {
      out.push(`<g class="card ghost" transform="translate(${cx} ${cy})"><rect width="${CW}" height="${CH}"/>
        <text class="nm" x="14" y="34">${esc(clip(n.ghost.label, 26))}</text><text class="nr" x="14" y="54">Not named in the notes</text></g>`);
      continue;
    }
    const p = d.byId.get(n.id)!;
    const src = portraitSrc(p);
    const cid = `${uid}-c${k++}`;
    let face = '';
    if (src) {
      defs.push(`<clipPath id="${cid}"><circle cx="30" cy="${CH / 2}" r="22"/></clipPath>`);
      face = `<circle class="circ" cx="30" cy="${CH / 2}" r="22"/><image href="${esc(src)}" x="8" y="${CH / 2 - 22}" width="44" height="44" preserveAspectRatio="xMidYMin slice" clip-path="url(#${cid})"/>`;
    } else {
      face = `<circle class="circ" cx="30" cy="${CH / 2}" r="22" stroke-dasharray="3 3"/><text class="circ-i" x="30" y="${CH / 2}">${esc(initials(p.name))}</text>`;
    }
    const noParents = !parentsOf.has(p.id);
    const nm = clip(p.name.length > 21 ? p.short ?? p.name : p.name, 21);
    out.push(`<a href="${esc(href('/people/' + p.id + '/'))}" aria-label="${esc(p.name)}, ${esc(lifeShort(d, p.id))}">
      <g class="card${focus === p.id ? ' focus' : ''}" transform="translate(${cx} ${cy})"><title>${esc(p.name)}</title><rect width="${CW}" height="${CH}"/>
        ${face}
        <text class="nm" x="62" y="30">${esc(nm)}</text>
        <text class="sb" x="62" y="48">${esc(lifeShort(d, p.id))}</text>
        ${noParents ? `<text class="nr" x="62" y="65">parents not recorded</text>` : ''}
      </g></a>`);
  }

  return `<svg class="tree" role="img" aria-label="Family tree of ${esc(comp.map((c) => d.byId.get(c)?.name).filter(Boolean).join(', '))}" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${defs.join('')}</defs>${out.join('')}</svg>`;
}

export function familyTitle(d: Data, comp: string[]): string {
  const ps = comp.map((id) => d.byId.get(id)!).filter(Boolean);
  const names = [...new Set(ps.map((p) => p.surname))];
  return names.length === 1 ? `The ${names[0]} family` : names.join(' and ');
}
