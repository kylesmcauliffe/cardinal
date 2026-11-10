import raw from '../../data/dataset.json';
import type { Dataset, EventRec, Person, Place, Relationship, RelType } from './types';
import { parseDate, sortKey, yearOf } from './dates';

export const FAMILY_TYPES: RelType[] = ['spouse', 'parent', 'sibling'];

export interface Rel {
  rel: Relationship;
  /** The other person, or null for an unnamed relative. */
  other: Person | null;
  /** 'out' when the focus person is `a`, 'in' when they are `b`. */
  dir: 'out' | 'in';
  label: string;
}

export interface Gap {
  key: string;
  text: string;
}

export interface Data {
  ds: Dataset;
  /** True for data loaded in the browser from a file: no static pages exist for it. */
  local: boolean;
  people: Person[];
  byId: Map<string, Person>;
  placeById: Map<string, Place>;
  events: EventRec[];
  relationships: Relationship[];
  eventsFor(id: string): EventRec[];
  relsFor(id: string): Rel[];
  family(id: string): { spouses: Rel[]; parents: Rel[]; children: Rel[]; siblings: Rel[] };
  connected(id: string): Map<string, { events: EventRec[]; rels: Relationship[] }>;
  placesFor(id: string): { place: Place; events: EventRec[] }[];
  gaps(id: string): Gap[];
  birth(id: string): EventRec | undefined;
  death(id: string): EventRec | undefined;
  lifeLabel(id: string): string;
  degree(id: string): number;
  families(): string[][];
  surnameGroups(): { surname: string; people: Person[] }[];
  eventsAt(placeId: string): EventRec[];
  peopleAt(placeId: string): Person[];
  firstYear(id: string): number | null;
}

export function initials(name: string): string {
  const parts = name
    .replace(/\b(Jr\.?|Sr\.?|II|III|IV)\b/g, '')
    .replace(/[“”"()]/g, '')
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return '?';
  const a = parts[0][0];
  const b = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (a + b).toUpperCase();
}

export function makeData(ds: Dataset): Data {
  const byId = new Map(ds.people.map((p) => [p.id, p]));
  const placeById = new Map(ds.places.map((p) => [p.id, p]));
  const evByPerson = new Map<string, EventRec[]>();
  const sortedEvents = [...ds.events].sort((a, b) => sortKey(a.date) - sortKey(b.date) || a.title.localeCompare(b.title));
  for (const e of sortedEvents) {
    for (const pid of e.people) {
      if (!evByPerson.has(pid)) evByPerson.set(pid, []);
      evByPerson.get(pid)!.push(e);
    }
  }
  const relByPerson = new Map<string, Relationship[]>();
  for (const r of ds.relationships) {
    for (const pid of [r.a, r.b]) {
      if (!pid) continue;
      if (!relByPerson.has(pid)) relByPerson.set(pid, []);
      relByPerson.get(pid)!.push(r);
    }
  }

  const eventsFor = (id: string) => evByPerson.get(id) ?? [];

  const relsFor = (id: string): Rel[] =>
    (relByPerson.get(id) ?? []).map((rel) => {
      const out = rel.a === id;
      const otherId = out ? rel.b : rel.a;
      return {
        rel,
        dir: out ? 'out' : 'in',
        other: otherId ? byId.get(otherId) ?? null : null,
        label: rel.label,
      } as Rel;
    });

  const family = (id: string) => {
    const all = relsFor(id);
    return {
      spouses: all.filter((r) => r.rel.type === 'spouse'),
      parents: all.filter((r) => r.rel.type === 'parent' && r.dir === 'in'),
      children: all.filter((r) => r.rel.type === 'parent' && r.dir === 'out'),
      siblings: all.filter((r) => r.rel.type === 'sibling'),
    };
  };

  const connected = (id: string) => {
    const out = new Map<string, { events: EventRec[]; rels: Relationship[] }>();
    const slot = (pid: string) => {
      if (!out.has(pid)) out.set(pid, { events: [], rels: [] });
      return out.get(pid)!;
    };
    for (const e of eventsFor(id)) for (const pid of e.people) if (pid !== id) slot(pid).events.push(e);
    for (const r of relByPerson.get(id) ?? []) {
      const other = r.a === id ? r.b : r.a;
      if (other) slot(other).rels.push(r);
    }
    return out;
  };

  const placesFor = (id: string) => {
    const m = new Map<string, EventRec[]>();
    for (const e of eventsFor(id)) {
      if (!e.place) continue;
      if (!m.has(e.place)) m.set(e.place, []);
      m.get(e.place)!.push(e);
    }
    return [...m.entries()]
      .filter(([pid]) => placeById.has(pid))
      .map(([pid, events]) => ({ place: placeById.get(pid)!, events }));
  };

  const birth = (id: string) => eventsFor(id).find((e) => e.kind === 'birth' && (e.subject ?? e.people[0]) === id);
  const death = (id: string) => eventsFor(id).find((e) => e.kind === 'death' && (e.subject ?? e.people[0]) === id);

  const lifeLabel = (id: string) => {
    const b = yearOf(birth(id)?.date);
    const d = yearOf(death(id)?.date);
    if (b && d) return `${b}–${d}`;
    if (b) return `b. ${b}`;
    if (d) return `d. ${d}`;
    return 'Life dates not recorded';
  };

  const gaps = (id: string): Gap[] => {
    const out: Gap[] = [];
    const p = byId.get(id)!;
    if (!birth(id)) out.push({ key: 'birth', text: 'Birth: not recorded in the notes' });
    if (!death(id)) out.push({ key: 'death', text: 'Death: not recorded in the notes' });
    const fam = family(id);
    if (!fam.parents.length) out.push({ key: 'parents', text: 'Parents: not recorded' });
    if (!p.portrait) out.push({ key: 'portrait', text: 'Portrait: none from a verified public-domain or CC source' });
    return out;
  };

  const degree = (id: string) => connected(id).size;

  const families = () => {
    const adj = new Map<string, Set<string>>();
    const touch = (a: string) => {
      if (!adj.has(a)) adj.set(a, new Set());
      return adj.get(a)!;
    };
    for (const r of ds.relationships) {
      if (!FAMILY_TYPES.includes(r.type)) continue;
      touch(r.a);
      if (r.b) {
        touch(r.b);
        adj.get(r.a)!.add(r.b);
        adj.get(r.b)!.add(r.a);
      }
    }
    const seen = new Set<string>();
    const comps: string[][] = [];
    for (const id of adj.keys()) {
      if (seen.has(id)) continue;
      const comp: string[] = [];
      const q = [id];
      seen.add(id);
      while (q.length) {
        const x = q.shift()!;
        comp.push(x);
        for (const y of adj.get(x)!) if (!seen.has(y)) { seen.add(y); q.push(y); }
      }
      comps.push(comp);
    }
    return comps.sort((a, b) => b.length - a.length);
  };

  const surnameGroups = () => {
    const m = new Map<string, Person[]>();
    for (const p of ds.people) {
      if (!p.surname) continue;
      if (!m.has(p.surname)) m.set(p.surname, []);
      m.get(p.surname)!.push(p);
    }
    return [...m.entries()]
      .map(([surname, people]) => ({ surname, people }))
      .sort((a, b) => b.people.length - a.people.length || a.surname.localeCompare(b.surname));
  };

  const eventsAt = (placeId: string) => sortedEvents.filter((e) => e.place === placeId);
  const peopleAt = (placeId: string) => {
    const ids = new Set(eventsAt(placeId).flatMap((e) => e.people));
    return [...ids].map((id) => byId.get(id)).filter(Boolean) as Person[];
  };

  const firstYear = (id: string) => {
    for (const e of eventsFor(id)) {
      const p = parseDate(e.date);
      if (p) return p.y0;
    }
    return null;
  };

  return {
    ds,
    local: ds.people.some((p) => p.imported),
    people: ds.people,
    byId,
    placeById,
    events: sortedEvents,
    relationships: ds.relationships,
    eventsFor,
    relsFor,
    family,
    connected,
    placesFor,
    gaps,
    birth,
    death,
    lifeLabel,
    degree,
    families,
    surnameGroups,
    eventsAt,
    peopleAt,
    firstYear,
  };
}

export const data: Data = makeData(raw as unknown as Dataset);
