import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = join(root, '../..');
const ds = JSON.parse(readFileSync(join(root, 'data/dataset.json'), 'utf8'));
const portraitReq = JSON.parse(readFileSync(join(root, 'data/portrait-requests.json'), 'utf8'));
const STATUSES = new Set(['VERIFIED', 'NEEDS SOURCE', 'CONTESTED', 'DRAFT']);
const REL_TYPES = new Set(['spouse', 'parent', 'sibling', 'mentor', 'partners', 'employer', 'recruited', 'conflict']);
const norm = (s) =>
  s.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/[*_`]/g, '').replace(/\s+/g, ' ').trim();
const people = new Map(ds.people.map((p) => [p.id, p]));
const places = new Map(ds.places.map((p) => [p.id, p]));
const repoPresent = existsSync(join(repoRoot, 'books/cardinal/_project/event-ledger.csv'));

const allCites = [
  ...ds.people.flatMap((p) => [...(p.roleCites ?? []), ...(p.birthSurnameCites ?? [])].map((c) => ({ c, what: `person ${p.id}` }))),
  ...ds.events.flatMap((e) => e.cites.map((c) => ({ c, what: `event ${e.id}` }))),
  ...ds.relationships.map((r) => r.cites.map((c) => ({ c, what: `relationship ${r.id}` }))).flat(),
];

function parseDate(d) {
  if (d == null) return null;
  const m = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?(?:\/(\d{4}))?$/.exec(d);
  if (!m) return NaN;
  const y = +m[1];
  if (m[2] && (+m[2] < 1 || +m[2] > 12)) return NaN;
  if (m[3]) {
    const dt = new Date(Date.UTC(y, +m[2] - 1, +m[3]));
    if (dt.getUTCMonth() !== +m[2] - 1 || dt.getUTCDate() !== +m[3]) return NaN;
  }
  return { start: y, end: m[4] ? +m[4] : y };
}

describe('dataset integrity', () => {
  it('dataset.json is up to date with curated.json and the ledger', () => {
    execFileSync('node', [join(root, 'scripts/build-data.mjs'), '--check'], { stdio: 'pipe' });
  });

  it('ids are unique', () => {
    for (const k of ['people', 'events', 'relationships', 'places']) {
      const ids = ds[k].map((x) => x.id);
      expect(new Set(ids).size, `${k} ids`).toBe(ids.length);
    }
  });

  it('events: valid dates, statuses, people and places; at least one cite', () => {
    for (const e of ds.events) {
      expect(STATUSES.has(e.status), `${e.id} status ${e.status}`).toBe(true);
      expect(e.people.length, `${e.id} people`).toBeGreaterThan(0);
      for (const id of e.people) expect(people.has(id), `${e.id} -> person ${id}`).toBe(true);
      if (e.place) expect(places.has(e.place), `${e.id} -> place ${e.place}`).toBe(true);
      expect(e.cites.length, `${e.id} cites`).toBeGreaterThan(0);
      const d = parseDate(e.date);
      expect(Number.isNaN(d), `${e.id} date ${e.date}`).toBe(false);
      if (d && d.end < d.start) throw new Error(`${e.id}: range ends before it starts`);
      if (e.date === null) expect(e.dateNote, `${e.id} undated needs a dateNote`).toBeTruthy();
    }
  });

  it('relationships: known people, known types, cited', () => {
    for (const r of ds.relationships) {
      expect(REL_TYPES.has(r.type), `${r.id} type`).toBe(true);
      expect(people.has(r.a), `${r.id} a`).toBe(true);
      if (r.b) expect(people.has(r.b), `${r.id} b`).toBe(true);
      else expect(r.bLabel, `${r.id} unnamed relative needs a bLabel`).toBeTruthy();
      expect(r.cites.length).toBeGreaterThan(0);
    }
  });

  it('every person appears in at least one event or relationship', () => {
    const seen = new Set([...ds.events.flatMap((e) => e.people), ...ds.relationships.flatMap((r) => [r.a, r.b])]);
    for (const p of ds.people) expect(seen.has(p.id), `${p.id} is isolated`).toBe(true);
  });

  it('role claims are cited', () => {
    for (const p of ds.people) if (p.role) expect(p.roleCites?.length, `${p.id} role needs cites`).toBeGreaterThan(0);
  });

  it('no event sits outside a known life (after death or before birth)', () => {
    for (const p of ds.people) {
      const evs = ds.events.filter((e) => e.people.includes(p.id));
      const birth = evs.find((e) => e.kind === 'birth' && e.people.includes(p.id));
      const death = evs.find((e) => e.kind === 'death' && (e.subject ?? e.people[0]) === p.id);
      const b = birth ? parseDate(birth.date)?.start : null;
      const dd = death ? parseDate(death.date)?.end : null;
      for (const e of evs) {
        const d = parseDate(e.date);
        if (!d || e === birth || e === death) continue;
        if (b != null && d.end < b) throw new Error(`${p.id}: ${e.id} before birth`);
        if (dd != null && d.start > dd && !/death|dies|inquest|probate|legacy|mausoleum|memorial|funds/i.test(e.title + (e.dateNote ?? ''))) {
          // posthumous entries must be explicitly about the death or its aftermath
          if (!e.people.some((x) => x !== p.id)) throw new Error(`${p.id}: ${e.id} after death`);
        }
      }
    }
  });
});

describe('source quotes are real', () => {
  it.skipIf(!repoPresent)('every cite quote appears verbatim (whitespace and quote-normalised) in its repo file', () => {
    const cache = new Map();
    const failures = [];
    for (const { c, what } of allCites) {
      const abs = join(repoRoot, c.f);
      if (!existsSync(abs)) { failures.push(`${what}: file missing ${c.f}`); continue; }
      if (!cache.has(abs)) cache.set(abs, norm(readFileSync(abs, 'utf8')));
      if (!cache.get(abs).includes(norm(c.q))) failures.push(`${what}: quote not found in ${c.f}: "${c.q}"`);
    }
    expect(failures).toEqual([]);
  });

  it.skipIf(!repoPresent)('ledger-derived events match the ledger line they cite', () => {
    const lines = readFileSync(join(repoRoot, 'books/cardinal/_project/event-ledger.csv'), 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/);
    for (const e of ds.events.filter((x) => x.origin === 'ledger')) {
      const c = e.cites[0];
      expect(lines[c.line - 1].startsWith(c.q), `${e.id} line ${c.line}`).toBe(true);
      expect(c.q.startsWith(e.date + ','), `${e.id} date`).toBe(true);
      expect(lines[c.line - 1], `${e.id} status`).toContain(e.status);
    }
  });

  it('cited files are registered as sources', () => {
    const paths = new Set(ds.sources.map((s) => s.path));
    for (const { c, what } of allCites) expect(paths.has(c.f), `${what} -> ${c.f}`).toBe(true);
  });
});

describe('portraits', () => {
  const allow = new Set(portraitReq.licenseAllowlist);
  const withPortrait = ds.people.filter((p) => p.portrait);
  it('have an allowed license, author, source URL and a file that matches its recorded hash', () => {
    const rec = JSON.parse(readFileSync(join(root, 'data/portraits.json'), 'utf8'));
    expect(rec.length).toBe(withPortrait.length);
    for (const r of rec) {
      expect(people.has(r.personId), r.personId).toBe(true);
      expect(allow.has(r.license), `${r.personId} license ${r.license}`).toBe(true);
      expect(r.author.length, `${r.personId} author`).toBeGreaterThan(0);
      expect(r.commonsUrl).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
      const abs = join(root, 'public', r.file);
      expect(existsSync(abs), r.file).toBe(true);
      expect(createHash('sha256').update(readFileSync(abs)).digest('hex'), `${r.personId} hash`).toBe(r.sha256);
    }
  });
  it('no unreferenced portrait files', () => {
    const files = new Set(withPortrait.map((p) => p.portrait.file.replace('portraits/', '')));
    for (const f of readdirSync(join(root, 'public/portraits'))) expect(files.has(f), `orphan ${f}`).toBe(true);
  });
  it('people without a verified portrait have none recorded (initials bubble)', () => {
    for (const p of ds.people) if (!p.portrait) expect(p.portrait).toBeNull();
  });
});

describe('repo hygiene', () => {
  const walk = (d) =>
    readdirSync(d).flatMap((n) => {
      if (['node_modules', 'dist', '.astro', 'process'].includes(n)) return [];
      const f = join(d, n);
      return statSync(f).isDirectory() ? walk(f) : [f];
    });
  const textFiles = walk(root).filter((f) => /\.(md|json|mjs|ts|astro|css|html|csv|ged)$/.test(f) && !f.endsWith('package-lock.json'));
  it('contains no secrets', () => {
    const pats = [/AKIA[0-9A-Z]{16}/, /-----BEGIN [A-Z ]*PRIVATE KEY-----/, /ghp_[A-Za-z0-9]{30,}/, /sk-[A-Za-z0-9]{32,}/, /api[_-]?key\s*[:=]\s*['"][^'"]{12,}/i];
    for (const f of textFiles) {
      const t = readFileSync(f, 'utf8');
      for (const p of pats) expect(p.test(t), `${f} matches ${p}`).toBe(false);
    }
  });
  it('mentions nothing from the excluded brand list', () => {
    const word = new RegExp('rain' + 'fall', 'i');
    for (const f of textFiles) expect(word.test(readFileSync(f, 'utf8')), f).toBe(false);
  });
});
