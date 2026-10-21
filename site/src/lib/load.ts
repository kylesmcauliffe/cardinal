import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import geo from '../data/geo.json';
import { chapterMeta, field, firstHeading, renderMarkdown, toPlain } from './render';

const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));
const bookRoot = join(repoRoot, 'books/cardinal');
const corpusRoot = join(repoRoot, 'site/corpus');

export const EPISODE_FILES = [
  {
    n: 1,
    icon: 'book-open',
    script: 'ep01-the-ledger.md',
    review: 'ep01-the-ledger-review.md',
    pr: 8,
    branch: 'podcast/ep01-02',
    sha: 'd093c77c9beb04fc4c59061ce4b3f5f114d29501',
  },
  {
    n: 2,
    icon: 'milestone',
    script: 'ep02-the-toll.md',
    review: 'ep02-the-toll-review.md',
    pr: 8,
    branch: 'podcast/ep01-02',
    sha: 'd093c77c9beb04fc4c59061ce4b3f5f114d29501',
  },
  {
    n: 3,
    icon: 'waypoints',
    script: 'ep03-the-octopus.md',
    review: 'ep03-the-octopus-review.md',
    pr: 11,
    branch: 'podcast/ep03-04',
    sha: '6eaed338a7ae80e35006b8389e11da232ba476eb',
    also: 'Rewrite chapters for this episode also sit on pull request #6 (rewrite/eps-3-4).',
  },
  {
    n: 4,
    icon: 'land-plot',
    script: 'ep04-the-boy-and-the-farm.md',
    review: 'ep04-the-boy-and-the-farm-review.md',
    pr: 11,
    branch: 'podcast/ep03-04',
    sha: '6eaed338a7ae80e35006b8389e11da232ba476eb',
    also: 'Rewrite chapters for this episode also sit on pull request #6 (rewrite/eps-3-4).',
  },
  {
    n: 5,
    icon: 'compass',
    script: 'ep05-the-engineers-century.md',
    review: 'ep05-the-engineers-century-review.md',
    pr: 10,
    branch: 'podcast/ep05-06',
    sha: '0f20ad63aac1d60befe71113f2804eb7a2f60510',
  },
  {
    n: 6,
    icon: 'trees',
    script: 'ep06-the-park.md',
    review: 'ep06-the-park-review.md',
    pr: 10,
    branch: 'podcast/ep05-06',
    sha: '0f20ad63aac1d60befe71113f2804eb7a2f60510',
  },
  {
    n: 7,
    icon: 'route',
    script: 'ep07-the-road-script.md',
    review: 'ep07-the-road-review.md',
    pr: 9,
    branch: 'podcast/ep07-08',
    sha: 'f99b27b04ce87c077c0e45e00a967805427bfe67',
  },
  {
    n: 8,
    icon: 'sun',
    script: 'ep08-the-open-era-script.md',
    review: 'ep08-the-open-era-review.md',
    pr: 9,
    branch: 'podcast/ep07-08',
    sha: 'f99b27b04ce87c077c0e45e00a967805427bfe67',
  },
] as const;

export type EpisodeFile = (typeof EPISODE_FILES)[number];

export type Doc = {
  id: string;
  href: string;
  title: string;
  kind: string;
  group: string;
  meta: string;
  text: string;
  raw: string;
  quarto: boolean;
};

export type LedgerRow = {
  date: string;
  event: string;
  actors: string;
  location: string;
  why: string;
  status: string;
  note: string;
};

export type Pin = {
  name: string;
  lat: number;
  lon: number;
  precision: string;
  events: { date: string; event: string; status: string }[];
};

type Archive = {
  docs: Doc[];
  episodes: ReturnType<typeof buildEpisodes>;
  ledger: LedgerRow[];
  author: string;
};

let archive: Archive | null = null;

function read(path: string): string {
  return readFileSync(path, 'utf8');
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.')) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (name.endsWith('.md')) out.push(full);
  }
  return out;
}

function parseOutline(md: string) {
  const eps = [];
  for (const part of md.split(/^## /m).slice(1)) {
    const head = part.split('\n', 1)[0];
    const m = head.match(/^Episode (\d+) — (.+?) \(([^)]+)\)\s*$/);
    if (!m) continue;
    eps.push({
      n: Number(m[1]),
      title: m[2],
      years: m[3],
      through: field(part, 'Through-line'),
      sources: field(part, 'Sources'),
      end: field(part, 'End turn'),
      realizes: field(part, 'Reader realizes'),
      repo: field(part, 'Repo'),
      cold: field(part, 'Cold open'),
    });
  }
  if (eps.length !== 8) {
    throw new Error(`Rewrite outline parsed ${eps.length} episodes, expected 8`);
  }
  const codaSplit = md.split(/^## Coda[^\n]*/m);
  const coda = codaSplit.length > 1 ? codaSplit[1].split(/^## /m)[0].trim() : '';
  return { eps, coda };
}

function parseQuartoOrder(): { file: string; part: string }[] {
  const yml = read(join(bookRoot, '_quarto.yml'));
  const items: { file: string; part: string }[] = [];
  let part = 'Front';
  let inBook = false;
  for (const line of yml.split('\n')) {
    if (line.startsWith('book:')) {
      inBook = true;
      continue;
    }
    if (inBook && /^[A-Za-z]/.test(line)) break;
    if (!inBook) continue;
    if (/^\s+appendices:/.test(line)) {
      part = 'Appendices';
      continue;
    }
    const partLine = line.match(/^\s+- part:\s+"(.*)"\s*$/);
    if (partLine) {
      part = partLine[1];
      continue;
    }
    const file = line.match(/^\s+- (\S+\.qmd)\s*$/);
    if (file) items.push({ file: file[1], part });
  }
  if (items.length < 52) {
    throw new Error(`Quarto order parsed ${items.length} files`);
  }
  return items;
}

function parseLedger(): LedgerRow[] {
  const raw = read(join(bookRoot, '_project/event-ledger.csv')).replace(/^\uFEFF/, '');
  const lines = raw.split(/\r?\n/).filter((l) => l.length);
  const rows: LedgerRow[] = [];
  let i = 1;
  while (i < lines.length) {
    let record = lines[i];
    while ((record.match(/"/g) || []).length % 2 === 1 && i + 1 < lines.length) {
      i += 1;
      record += `\n${lines[i]}`;
    }
    rows.push(parseCsvRecord(record));
    i += 1;
  }
  return rows;
}

function parseCsvRecord(record: string): LedgerRow {
  const cells: string[] = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < record.length; i++) {
    const c = record[i];
    if (q) {
      if (c === '"' && record[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ',') {
      cells.push(cur);
      cur = '';
    } else cur += c;
  }
  cells.push(cur);
  const [date, event, actors, location, why, status, note] = cells;
  return {
    date: date ?? '',
    event: event ?? '',
    actors: actors ?? '',
    location: location ?? '',
    why: why ?? '',
    status: status ?? '',
    note: note ?? '',
  };
}

function docFrom(path: string, id: string, href: string, kind: string, group: string, quarto = false): Doc {
  const raw = read(path);
  const title = firstHeading(raw) || id;
  const meta = quarto ? chapterMeta(raw) : '';
  return {
    id,
    href,
    title,
    kind,
    group,
    meta,
    text: toPlain(raw),
    raw,
    quarto,
  };
}

function buildDocs(): Doc[] {
  const docs: Doc[] = [];
  for (const item of parseQuartoOrder()) {
    const stem = item.file.replace(/^ch\//, '').replace(/\.qmd$/, '');
    const id = `draft/${stem}`;
    docs.push(
      docFrom(join(bookRoot, item.file), id, `/research/${id}`, 'Draft', item.part, true),
    );
  }
  for (const name of [
    'README.md',
    'thesis.md',
    'outline.md',
    'voice.md',
    'chapter-template.md',
    'research-log.md',
    'source-inventory.md',
    'cut-material.md',
    'street-skeleton.md',
    'inherited-epigraph.md',
  ]) {
    const stem = name.replace(/\.md$/, '').toLowerCase();
    const id = `apparatus/${stem}`;
    docs.push(docFrom(join(bookRoot, '_project', name), id, `/research/${id}`, 'Apparatus', 'Apparatus'));
  }

  const rewriteRoot = join(corpusRoot, 'rewrite');
  for (const full of walk(rewriteRoot)) {
    const rel = relative(rewriteRoot, full).replace(/\\/g, '/');
    const id = `rewrite/${rel.replace(/\.md$/, '')}`;
    let group = 'Rewrite plan';
    let kind = 'Plan';
    if (rel.startsWith('chapters/')) {
      group = 'Rewrite chapters';
      kind = 'Rewrite';
    } else if (rel.startsWith('notes/')) {
      group = 'Reading notes';
      kind = 'Note';
    } else if (rel.startsWith('research/')) {
      group = 'Rewrite plan';
      kind = 'Plan';
    }
    docs.push(docFrom(full, id, `/research/${id}`, kind, group));
  }
  return docs;
}

function buildEpisodes() {
  const outline = parseOutline(read(join(corpusRoot, 'rewrite/outline.md')));
  return EPISODE_FILES.map((file) => {
    const plan = outline.eps.find((e) => e.n === file.n);
    if (!plan) throw new Error(`Missing outline episode ${file.n}`);
    const scriptPath = join(corpusRoot, 'podcast', file.script);
    const reviewPath = join(corpusRoot, 'podcast', file.review);
    const script = read(scriptPath);
    const review = read(reviewPath);
    return {
      ...file,
      ...plan,
      audio: `/audio/ep${String(file.n).padStart(2, '0')}.mp3`,
      script,
      review,
      coda: file.n === 8 ? outline.coda : '',
    };
  });
}

function load(): Archive {
  if (archive) return archive;
  const yml = read(join(bookRoot, '_quarto.yml'));
  const author = yml.match(/author:\s*"([^"]+)"/)?.[1] ?? '';
  archive = {
    docs: buildDocs(),
    episodes: buildEpisodes(),
    ledger: parseLedger(),
    author,
  };
  return archive;
}

export function getEpisodes() {
  return load().episodes;
}

export function getEpisode(n: number) {
  const ep = load().episodes.find((e) => e.n === n);
  if (!ep) throw new Error(`No episode ${n}`);
  return ep;
}

export function getDocs() {
  return load().docs;
}

export function getDoc(id: string) {
  const doc = load().docs.find((d) => d.id === id);
  if (!doc) throw new Error(`No document ${id}`);
  return doc;
}

export function neighbor(doc: Doc): { prev?: Doc; next?: Doc } {
  const siblings = load().docs.filter((d) => d.group === doc.group);
  const i = siblings.findIndex((d) => d.id === doc.id);
  return { prev: siblings[i - 1], next: siblings[i + 1] };
}

export function getLedger() {
  return load().ledger;
}

export function getAuthor() {
  return load().author;
}

export function draftLinksFor(repoLine: string) {
  return load().docs.filter((d) => {
    if (!d.id.startsWith('draft/')) return false;
    const stem = d.id.slice('draft/'.length);
    return repoLine.includes(stem);
  });
}

export function rewriteChaptersFor(n: number) {
  const prefix = `rewrite/chapters/ep${n}-`;
  return load().docs.filter((d) => d.id.startsWith(prefix));
}

export function getPeople() {
  const map = new Map<string, LedgerRow[]>();
  for (const row of load().ledger) {
    for (const name of row.actors.split(';').map((s) => s.trim()).filter((s) => s && s !== '—')) {
      const list = map.get(name) ?? [];
      list.push(row);
      map.set(name, list);
    }
  }
  return [...map.entries()]
    .map(([name, events]) => ({ name, events }))
    .sort((a, b) => a.name.localeCompare(b.name, 'en'));
}

const GEO = geo as Record<string, { lat: number; lon: number; precision: string }>;

export function getPins(): Pin[] {
  const pins: Pin[] = [];
  const byLoc = new Map<string, LedgerRow[]>();
  for (const row of load().ledger) {
    const list = byLoc.get(row.location) ?? [];
    list.push(row);
    byLoc.set(row.location, list);
  }
  for (const [name, events] of byLoc) {
    const point = GEO[name];
    if (!point) continue;
    pins.push({
      name,
      lat: point.lat,
      lon: point.lon,
      precision: point.precision,
      events: events.map((e) => ({ date: e.date, event: e.event, status: e.status })),
    });
  }
  return pins.sort((a, b) => a.name.localeCompare(b.name));
}

export function unpinnedLocations() {
  const seen = new Map<string, number>();
  for (const row of load().ledger) {
    if (GEO[row.location]) continue;
    seen.set(row.location, (seen.get(row.location) ?? 0) + 1);
  }
  return [...seen.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name));
}

export type BibEntry = {
  type: string;
  key: string;
  title: string;
  author: string;
  year: string;
  url: string;
  note: string;
};

export function getBibliography(): BibEntry[] {
  const raw = read(join(bookRoot, 'references.bib'));
  const entries: BibEntry[] = [];
  for (const chunk of raw.split(/\n(?=@)/)) {
    const head = chunk.match(/^@(\w+)\s*\{\s*([^,\s]+)\s*,/);
    if (!head) continue;
    const fields = parseBibFields(chunk.slice(head[0].length));
    entries.push({
      type: head[1],
      key: head[2],
      title: cleanBib(fields.title || fields.booktitle || head[2]),
      author: cleanBib(fields.author || fields.editor || ''),
      year: (fields.year || '').replace(/[^\d].*$/, ''),
      url: (fields.url || '').trim(),
      note: cleanBib(fields.note || ''),
    });
  }
  return entries.sort((a, b) => a.title.localeCompare(b.title, 'en'));
}

function parseBibFields(body: string): Record<string, string> {
  const fields: Record<string, string> = {};
  let i = 0;
  while (i < body.length) {
    const slice = body.slice(i);
    const m = /^[ \t\r\n,]*([A-Za-z][\w-]*)\s*=\s*/.exec(slice);
    if (!m) break;
    i += m.index + m[0].length;
    let value = '';
    if (body[i] === '{') {
      let depth = 0;
      const start = i;
      for (; i < body.length; i++) {
        if (body[i] === '{') depth += 1;
        else if (body[i] === '}') {
          depth -= 1;
          if (depth === 0) {
            i += 1;
            break;
          }
        }
      }
      value = body.slice(start + 1, i - 1);
    } else if (body[i] === '"') {
      i += 1;
      const start = i;
      while (i < body.length && !(body[i] === '"' && body[i - 1] !== '\\')) i += 1;
      value = body.slice(start, i);
      i += 1;
    } else {
      const start = i;
      while (i < body.length && body[i] !== ',' && body[i] !== '\n') i += 1;
      value = body.slice(start, i);
    }
    fields[m[1].toLowerCase()] = value.replace(/\s+/g, ' ').trim();
  }
  return fields;
}

function cleanBib(value: string): string {
  return value.replace(/[{}]/g, '').replace(/\s+/g, ' ').trim();
}

export async function htmlFor(doc: Doc): Promise<string> {
  return renderMarkdown(doc.raw, doc.quarto);
}

export function searchRecords() {
  const docs = load().docs.map((d) => ({
    href: d.href,
    title: d.title,
    kind: d.kind,
    group: d.group,
    meta: d.meta,
    text: d.text,
  }));
  const episodes = load().episodes.flatMap((ep) => [
    {
      href: `/episodes/${ep.n}#script`,
      title: `Episode ${ep.n}: ${ep.title}`,
      kind: 'Script',
      group: 'Episodes',
      meta: ep.years,
      text: toPlain(ep.script),
    },
    {
      href: `/episodes/${ep.n}#sources`,
      title: `Episode ${ep.n} review: ${ep.title}`,
      kind: 'Review',
      group: 'Episodes',
      meta: `PR #${ep.pr}`,
      text: toPlain(ep.review),
    },
  ]);
  return [...episodes, ...docs];
}
