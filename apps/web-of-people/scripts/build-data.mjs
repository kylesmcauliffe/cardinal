#!/usr/bin/env node
// Merges data/curated.json with the Cardinal event ledger into data/dataset.json.
// `--check` recomputes and fails if the committed dataset.json has drifted.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const repoRoot = join(root, '../..');
const check = process.argv.includes('--check');

const curated = JSON.parse(readFileSync(join(root, 'data/curated.json'), 'utf8'));
// Second research pass (data/research.json): patches to curated events, ledger status
// overrides with external cites, and added people, places, events, relationships and
// organisations. curated.json stays as first written; every change here is cited.
const researchPath = join(root, 'data/research.json');
const research = existsSync(researchPath) ? JSON.parse(readFileSync(researchPath, 'utf8')) : {};
for (const k of ['people', 'places', 'events', 'relationships']) curated[k] = [...curated[k], ...(research[k] ?? [])];
curated.organisations = [...(curated.organisations ?? []), ...(research.organisations ?? [])];
curated.affiliations = [...(curated.affiliations ?? []), ...(research.affiliations ?? [])];
curated.ledger.overrides = { ...(curated.ledger.overrides ?? {}), ...(research.ledgerOverrides ?? {}) };
for (const [id, patch] of Object.entries(research.eventUpdates ?? {})) {
  const ev = curated.events.find((e) => e.id === id);
  if (!ev) throw new Error(`research.eventUpdates: unknown curated event ${id}`);
  const { cites, ...rest } = patch;
  Object.assign(ev, rest);
  if (cites) ev.cites = [...ev.cites, ...cites];
}

for (const [id, patch] of Object.entries(research.relationshipUpdates ?? {})) {
  const rel = curated.relationships.find((r) => r.id === id);
  if (!rel) throw new Error(`research.relationshipUpdates: unknown relationship ${id}`);
  const { cites, ...rest } = patch;
  Object.assign(rel, rest);
  if (rest.b) delete rel.bLabel;
  if (cites) rel.cites = [...rel.cites, ...cites];
}

const readJson = (f) => (existsSync(join(root, f)) ? JSON.parse(readFileSync(join(root, f), 'utf8')) : []);
const portraits = [...readJson('data/portraits.json'), ...readJson('data/portraits-other.json')];
const portraitGaps = existsSync(join(root, 'data/portrait-gaps.json'))
  ? JSON.parse(readFileSync(join(root, 'data/portrait-gaps.json'), 'utf8'))
  : [];
const geoPath = join(repoRoot, 'site/src/data/geo.json');
const geo = existsSync(geoPath) ? JSON.parse(readFileSync(geoPath, 'utf8')) : {};
const geoSnapshot = JSON.parse(readFileSync(join(root, 'data/geo-snapshot.json'), 'utf8'));
const geoSource = existsSync(geoPath) ? geo : geoSnapshot;

const ledgerFile = curated.ledger.file;
const ledgerPath = join(repoRoot, ledgerFile);
const ledgerRaw = existsSync(ledgerPath)
  ? readFileSync(ledgerPath, 'utf8')
  : readFileSync(join(root, 'data/ledger-snapshot.csv'), 'utf8');

const slug = (s) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function parseRecords(text) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/);
  const out = [];
  let i = 1;
  while (i < lines.length) {
    if (!lines[i]) { i += 1; continue; }
    const start = i;
    let rec = lines[i];
    while ((rec.match(/"/g) || []).length % 2 === 1 && i + 1 < lines.length) { i += 1; rec += `\n${lines[i]}`; }
    const cells = [];
    let cur = ''; let q = false;
    for (let k = 0; k < rec.length; k++) {
      const c = rec[k];
      if (q) { if (c === '"' && rec[k + 1] === '"') { cur += '"'; k++; } else if (c === '"') q = false; else cur += c; }
      else if (c === '"') q = true;
      else if (c === ',') { cells.push(cur); cur = ''; }
      else cur += c;
    }
    cells.push(cur);
    const [date, event, actors, location, why, status, note] = cells;
    out.push({ line: start + 1, raw: lines[start], date, event, actors, location, why, status, note: note ?? '' });
    i += 1;
  }
  return out;
}

const NON_PLACES = new Set(['NASDAQ']);
const placeFromRaw = (raw) => {
  if (!raw || NON_PLACES.has(raw) || /[/↔]/.test(raw)) return null;
  return { id: slug(raw), name: raw };
};

function kindOf(title) {
  if (/\b(dies|born)\b/i.test(title)) return 'life';
  if (/\b(founded|opens|established|incorporated|IPO|launch|introduces|developed|development)\b/i.test(title)) return 'founding';
  if (/\b(Act|law|Treaty|Purchase|Tax|Constitution|admitted|enacted|signed|decided|Order|ceded|cedes|settlement|passes|Land)\b/.test(title)) return 'law';
  if (/\b(published|publication|paper|delivers|reporting|reports)\b/i.test(title)) return 'publication';
  if (/\b(resigns?|forced out|strike|shootout|occupy|tear-gas|removes)\b/i.test(title)) return 'conflict';
  return 'other';
}

const peopleIds = new Set(curated.people.map((p) => p.id));
const aliases = curated.ledger.actorAliases;
const rows = parseRecords(ledgerRaw);
const unmatched = new Map();
const ledgerEvents = [];
const usedOverrides = new Set();
for (const r of rows) {
  const names = r.actors.split(';').map((s) => s.trim()).filter(Boolean);
  const ids = new Set();
  for (const n of names) {
    if (aliases[n]) aliases[n].forEach((id) => ids.add(id));
    else unmatched.set(n, (unmatched.get(n) ?? 0) + 1);
  }
  const key = `${r.date}|${r.event}`;
  for (const [k, extra] of Object.entries(curated.ledger.ledgerNamedInNote)) if (key.startsWith(k)) extra.forEach((id) => ids.add(id));
  if (!ids.size) continue;
  const life = Object.entries(curated.ledger.lifeEvents).find(([k]) => key.startsWith(k))?.[1];
  const place = placeFromRaw(r.location);
  const evId = `ledger-${r.date}-${slug(r.event).slice(0, 48)}`;
  const ov = curated.ledger.overrides?.[evId];
  if (ov) usedOverrides.add(evId);
  ledgerEvents.push({
    id: evId,
    people: [...ids].sort(),
    date: ov?.date ?? r.date,
    ...(ov?.date && ov.date !== r.date ? { ledgerDate: r.date } : {}),
    ...(ov?.dateNote ? { dateNote: ov.dateNote } : {}),
    kind: life?.kind ?? kindOf(r.event),
    ...(life?.subject ? { subject: life.subject } : {}),
    title: r.event,
    place: place?.id ?? null,
    locationText: r.location,
    status: ov ? ov.status : r.status,
    ...(ov && ov.status !== r.status ? { ledgerStatus: r.status } : {}),
    ...(ov?.revisionNote ? { revisionNote: ov.revisionNote } : {}),
    ...(ov?.note ? { note: ov.note } : {}),
    why: r.why,
    ...(r.note ? { ledgerNote: r.note } : {}),
    origin: 'ledger',
    cites: [{ f: ledgerFile, q: r.raw.slice(0, 80), line: r.line }, ...(ov?.cites ?? [])],
  });
}

for (const k of Object.keys(curated.ledger.overrides ?? {}))
  if (!usedOverrides.has(k)) throw new Error(`ledger override for unknown event id: ${k}`);

const curatedEvents = curated.events.map((e) => ({
  ...e,
  date: e.date ?? null,
  place: e.place ?? null,
  origin: 'curated',
}));

const events = [...ledgerEvents, ...curatedEvents];

// places: only those referenced by an event; coordinates only from the repo's geo.json
const placeNames = new Map();
for (const r of rows) {
  const p = placeFromRaw(r.location);
  if (p) placeNames.set(p.id, p.name);
}
for (const p of curated.places) placeNames.set(p.id, p.name);
const used = new Set(events.map((e) => e.place).filter(Boolean));
const places = [...used].sort().map((id) => {
  const name = placeNames.get(id);
  if (!name) throw new Error(`event references unknown place id: ${id}`);
  const g = geoSource[name];
  const cur = curated.places.find((p) => p.id === id);
  return {
    id,
    name,
    kind: cur?.kind ?? g?.precision ?? 'place',
    ...(g ? { lat: g.lat, lon: g.lon, coordNote: 'Position for the place name, from site/src/data/geo.json; not a measurement from the manuscript.' } : {}),
  };
});

const peopleOut = curated.people
  .map((p) => {
    const pr = portraits.find((x) => x.personId === p.id);
    return { ...p, portrait: pr ? { file: pr.file, author: pr.author, license: pr.license, licenseUrl: pr.licenseUrl, pageUrl: pr.pageUrl, pageTitle: pr.pageTitle, date: pr.date, scaled: pr.scaled, fileUrl: pr.fileUrl, medium: pr.medium, subjectEvidence: pr.subjectEvidence, verifiedOn: pr.verifiedOn, ...(pr.source ? { source: pr.source, rightsStatement: pr.rightsStatement } : {}) } : null, ...(!pr && portraitGaps.find((g) => g.personId === p.id) ? { portraitGap: (({ searched, why, checked }) => ({ searched, why, checked }))(portraitGaps.find((g) => g.personId === p.id)) } : {}) };
  })
  .sort((a, b) => a.id.localeCompare(b.id));

const relationships = curated.relationships.map((r) => ({ ...r, fromGroup: false }));
for (const g of curated.groups) {
  for (let i = 0; i < g.members.length; i++)
    for (let j = i + 1; j < g.members.length; j++)
      relationships.push({ id: `${g.id}:${g.members[i]}:${g.members[j]}`, type: g.type, a: g.members[i], b: g.members[j], label: g.label, cites: g.cites, fromGroup: true });
}

const orgs = (curated.organisations ?? []).slice().sort((a, b) => a.id.localeCompare(b.id));
const affiliations = (curated.affiliations ?? []).slice().sort((a, b) => a.id.localeCompare(b.id));
const citeColls = () => [
  peopleOut.flatMap((p) => [...(p.roleCites ?? []), ...(p.birthSurnameCites ?? [])]),
  events.flatMap((e) => e.cites),
  relationships.flatMap((r) => r.cites),
  orgs.flatMap((o) => o.cites),
  affiliations.flatMap((a) => a.cites),
];

const sourcePaths = new Set();
for (const coll of citeColls()) for (const c of coll) if (c.f) sourcePaths.add(c.f);
const sourceMeta = (path) => {
  if (path.endsWith('event-ledger.csv')) return { title: 'Event ledger', kind: 'ledger', weight: 'Each row carries VERIFIED, NEEDS SOURCE or CONTESTED, as written by the author.' };
  if (path.endsWith('research-log.md')) return { title: 'Research log', kind: 'research-log', weight: 'Claims logged with a status and a source, as written by the author.' };
  if (path.endsWith('timeline.md')) return { title: 'Rewrite master timeline', kind: 'drafting-note', weight: 'Drafting note citing a named book per entry; the repo has not verified it independently.' };
  if (path.endsWith('GLOSSARY.md')) return { title: 'Rewrite names and terms glossary', kind: 'drafting-note', weight: 'Style glossary of names and spellings; used only for name, family and grouping statements.' };
  if (path.includes('/chapters/')) {
    const abs = join(repoRoot, path);
    const first = existsSync(abs) ? readFileSync(abs, 'utf8').split('\n').find((l) => /^#\s/.test(l)) : null;
    return { title: `Rewrite chapter ${path.split('/').pop().replace(/\.md$/, '')}${first ? ` (${first.replace(/^#\s*/, '')})` : ''}`, kind: 'drafting-note', weight: 'Documentary-rewrite chapter text with an inline book citation; the repo has not verified it independently.' };
  }
  return { title: path, kind: 'manuscript', weight: 'Manuscript source.' };
};
const sources = [...sourcePaths].sort().map((path) => ({ path, ...sourceMeta(path) }));

const verifPath = join(root, 'data/web-verification.json');
const verified = new Map((existsSync(verifPath) ? JSON.parse(readFileSync(verifPath, 'utf8')).entries : []).map((e) => [e.url, e]));
const webMap = new Map();
for (const coll of citeColls())
  for (const c of coll) {
    if (!c.url) continue;
    const cur = webMap.get(c.url) ?? { url: c.url, title: c.title ?? c.url, publisher: c.publisher ?? '', kind: c.kind ?? 'reference', retrieved: verified.get(c.url)?.retrieved ?? '', cites: 0 };
    cur.cites += 1;
    webMap.set(c.url, cur);
  }
const webSources = [...webMap.values()].sort((a, b) => a.url.localeCompare(b.url));

const dataset = {
  meta: {
    title: 'Web of People: Cardinal dataset',
    repo: curated.repo,
    counts: { people: peopleOut.length, events: events.length, relationships: relationships.length, places: places.length, sources: sources.length, webSources: webSources.length, orgs: orgs.length, affiliations: affiliations.length },
    ledgerRows: rows.length,
    ledgerActorsNotMapped: [...unmatched.keys()].sort(),
    notice: 'Every fact cites a repository file or an external page, with a verbatim quote. Unknown stays unknown.',
  },
  people: peopleOut,
  events,
  relationships,
  places,
  sources,
  webSources,
  orgs,
  affiliations,
};

const out = JSON.stringify(dataset, null, 2) + '\n';
const target = join(root, 'data/dataset.json');
if (check) {
  const cur = existsSync(target) ? readFileSync(target, 'utf8') : '';
  if (cur !== out) { console.error('data/dataset.json is stale. Run: npm run data'); process.exit(1); }
  console.log('dataset.json is current.');
} else {
  writeFileSync(target, out);
  console.log(`wrote dataset.json: ${JSON.stringify(dataset.meta.counts)}`);
  console.log('ledger actors not mapped to a person:', dataset.meta.ledgerActorsNotMapped.join(' | '));
}
