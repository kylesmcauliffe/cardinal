import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalise } from '../scripts/lib/webtext.mjs';
import { imageSize } from '../scripts/lib/imgsize.mjs';

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

const orgs = ds.orgs ?? [];
const affiliations = ds.affiliations ?? [];
const everyCite = [
  ...ds.people.flatMap((p) => [...(p.roleCites ?? []), ...(p.birthSurnameCites ?? [])].map((c) => ({ c, what: `person ${p.id}` }))),
  ...ds.events.flatMap((e) => e.cites.map((c) => ({ c, what: `event ${e.id}` }))),
  ...ds.relationships.map((r) => r.cites.map((c) => ({ c, what: `relationship ${r.id}` }))).flat(),
  ...orgs.flatMap((o) => o.cites.map((c) => ({ c, what: `organisation ${o.id}` }))),
  ...affiliations.flatMap((a) => a.cites.map((c) => ({ c, what: `affiliation ${a.id}` }))),
];
const allCites = everyCite.filter(({ c }) => c.f);
const webCites = everyCite.filter(({ c }) => c.url);
const WEB_KINDS = new Set(['primary', 'reference', 'scholarly', 'institutional', 'tertiary']);
const qHash = (q) => createHash('sha256').update(normalise(q)).digest('hex');

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
      const birth = evs.find((e) => e.kind === 'birth' && (e.subject ?? e.people[0]) === p.id);
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
      expect(lines[c.line - 1], `${e.id} status`).toContain(e.ledgerStatus ?? e.status);
    }
  });

  it('cited files are registered as sources', () => {
    const paths = new Set(ds.sources.map((s) => s.path));
    for (const { c, what } of allCites) expect(paths.has(c.f), `${what} -> ${c.f}`).toBe(true);
  });
});

describe('external sources', () => {
  const ver = JSON.parse(readFileSync(join(root, 'data/web-verification.json'), 'utf8'));
  const byUrl = new Map(ver.entries.map((e) => [e.url, e]));

  it('every citation is either a repository file or a web page, never both or neither', () => {
    for (const { c, what } of everyCite) {
      expect(Boolean(c.f) !== Boolean(c.url), `${what}: needs exactly one of f / url`).toBe(true);
      expect(c.q.trim().length, `${what}: quote`).toBeGreaterThan(8);
    }
  });

  it('web citations name their page, publisher and kind and use a web URL', () => {
    for (const { c, what } of webCites) {
      expect(c.url, what).toMatch(/^https?:\/\/[^\s]+$/);
      expect(c.title?.length, `${what} title`).toBeGreaterThan(2);
      expect(c.publisher?.length, `${what} publisher`).toBeGreaterThan(1);
      expect(WEB_KINDS.has(c.kind), `${what} kind ${c.kind}`).toBe(true);
      expect(c.q.length, `${what} quote is a passage, not a page`).toBeLessThanOrEqual(420);
    }
  });

  it('every web quote was found on its page when last verified (data/web-verification.json)', () => {
    const failures = [];
    for (const { c, what } of webCites) {
      const e = byUrl.get(c.url);
      if (!e) { failures.push(`${what}: ${c.url} was never verified. Run: npm run verify:web`); continue; }
      if (e.httpStatus !== 200) failures.push(`${what}: ${c.url} answered HTTP ${e.httpStatus}`);
      const q = e.quotes.find((x) => x.qSha256 === qHash(c.q));
      if (!q) failures.push(`${what}: quote not in the verification record for ${c.url}: "${c.q.slice(0, 60)}"`);
      else if (!q.found) failures.push(`${what}: quote not found on ${c.url}: "${c.q.slice(0, 60)}"`);
    }
    expect(failures).toEqual([]);
  });

  it('the verification record holds no URL that the data no longer cites', () => {
    const used = new Set(webCites.map(({ c }) => c.url));
    for (const e of ver.entries) expect(used.has(e.url), `orphan ${e.url}`).toBe(true);
  });

  it('webSources lists each cited page once with its citation count', () => {
    const counts = new Map();
    for (const { c } of webCites) counts.set(c.url, (counts.get(c.url) ?? 0) + 1);
    expect(ds.webSources.length).toBe(counts.size);
    for (const w of ds.webSources) {
      expect(counts.get(w.url), w.url).toBe(w.cites);
      expect(w.retrieved, `${w.url} retrieved date`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('a curated event is only VERIFIED on a research log, the ledger or an external source, never drafting notes alone', () => {
    for (const e of ds.events) {
      if (e.origin !== 'curated' || e.status !== 'VERIFIED') continue;
      const ok = e.cites.some((c) => c.url || /research-log\.md$|event-ledger\.csv$/.test(c.f));
      expect(ok, `${e.id} is VERIFIED on drafting notes only`).toBe(true);
    }
  });

  it('revised events and overridden ledger statuses carry an explanation', () => {
    for (const e of ds.events) {
      if (e.ledgerStatus) expect(e.revisionNote || e.note, `${e.id} changed ledger status without a note`).toBeTruthy();
      if (e.ledgerStatus) expect(e.cites.some((c) => c.url), `${e.id} overrides the ledger without an external cite`).toBe(true);
    }
  });
});

describe('family links', () => {
  const birthYear = (id) => {
    const b = ds.events.find((e) => e.kind === 'birth' && (e.subject ?? e.people[0]) === id && e.date);
    const d = b ? parseDate(b.date) : null;
    return d && !Number.isNaN(d) ? d.start : null;
  };
  const parentRels = ds.relationships.filter((r) => r.type === 'parent' && r.b);

  it('no duplicate family pairs', () => {
    const seen = new Set();
    for (const r of ds.relationships.filter((x) => x.b && ['spouse', 'sibling', 'parent'].includes(x.type))) {
      const k = r.type === 'parent' ? `${r.type}|${r.a}|${r.b}` : `${r.type}|${[r.a, r.b].sort().join('|')}`;
      expect(seen.has(k), `duplicate ${k}`).toBe(false);
      seen.add(k);
    }
  });

  it('parents are 12 to 80 years older than their children where both birth years are recorded', () => {
    for (const r of parentRels) {
      const pb = birthYear(r.a);
      const cb = birthYear(r.b);
      if (pb == null || cb == null) continue;
      expect(cb - pb, `${r.a} -> ${r.b}: ${cb - pb} years`).toBeGreaterThanOrEqual(12);
      expect(cb - pb, `${r.a} -> ${r.b}: ${cb - pb} years`).toBeLessThanOrEqual(80);
    }
  });

  it('nobody is their own ancestor', () => {
    const kids = new Map();
    for (const r of parentRels) kids.set(r.a, [...(kids.get(r.a) ?? []), r.b]);
    const visit = (id, path) => {
      expect(path.includes(id), `cycle through ${[...path, id].join(' > ')}`).toBe(false);
      for (const k of kids.get(id) ?? []) visit(k, [...path, id]);
    };
    for (const id of kids.keys()) visit(id, []);
  });

  it('no person has more than two named parents', () => {
    const n = new Map();
    for (const r of parentRels) n.set(r.b, (n.get(r.b) ?? 0) + 1);
    for (const [id, c] of n) expect(c, `${id} has ${c} named parents`).toBeLessThanOrEqual(2);
  });
});

describe('organisations', () => {
  it('have unique ids, a summary and at least one cite', () => {
    expect(new Set(orgs.map((o) => o.id)).size).toBe(orgs.length);
    for (const o of orgs) {
      expect(o.summary.length, o.id).toBeGreaterThan(10);
      expect(o.cites.length, o.id).toBeGreaterThan(0);
    }
  });
  it('every affiliation links a known person to a known organisation and is cited', () => {
    const oid = new Set(orgs.map((o) => o.id));
    expect(new Set(affiliations.map((a) => a.id)).size).toBe(affiliations.length);
    for (const a of affiliations) {
      expect(people.has(a.person), `${a.id} person ${a.person}`).toBe(true);
      expect(oid.has(a.org), `${a.id} org ${a.org}`).toBe(true);
      expect(a.role.length, a.id).toBeGreaterThan(2);
      expect(a.cites.length, a.id).toBeGreaterThan(0);
    }
  });
  it('every organisation has at least one person linked', () => {
    for (const o of orgs) expect(affiliations.some((a) => a.org === o.id), `${o.id} has no people`).toBe(true);
  });
});

describe('portraits', () => {
  const allow = new Set(portraitReq.licenseAllowlist);
  const withPortrait = ds.people.filter((p) => p.portrait);
  const commonsRec = JSON.parse(readFileSync(join(root, 'data/portraits.json'), 'utf8'));
  const otherRec = JSON.parse(readFileSync(join(root, 'data/portraits-other.json'), 'utf8'));
  const rec = [...commonsRec, ...otherRec];
  const portraitGaps = JSON.parse(readFileSync(join(root, 'data/portrait-gaps.json'), 'utf8'));
  it('have an allowed license, author, source URLs and a file that matches its recorded hash', () => {
    expect(rec.length).toBe(withPortrait.length);
    for (const r of rec) {
      expect(people.has(r.personId), r.personId).toBe(true);
      expect(allow.has(r.license) || (r.source && /^Public domain/.test(r.license)), `${r.personId} license ${r.license}`).toBe(true);
      expect(r.author.length, `${r.personId} author`).toBeGreaterThan(0);
      if (r.source) expect(r.pageUrl).toMatch(/^https:\/\/archive\.org\//);
      else expect(r.pageUrl).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
      const abs = join(root, 'public', r.file);
      expect(existsSync(abs), r.file).toBe(true);
      expect(createHash('sha256').update(readFileSync(abs)).digest('hex'), `${r.personId} hash`).toBe(r.sha256);
    }
  });
  it('record the original file URL, what the image is, why it is this person, and when it was checked', () => {
    for (const r of rec) {
      expect(r.fileUrl, `${r.personId} fileUrl`).toMatch(r.source ? /^https:\/\/archive\.org\// : /^https:\/\/upload\.wikimedia\.org\//);
      expect(r.medium?.length, `${r.personId} medium`).toBeGreaterThan(3);
      expect(r.subjectEvidence?.length, `${r.personId} subjectEvidence`).toBeGreaterThan(8);
      expect(r.date?.length, `${r.personId} date`).toBeGreaterThan(0);
      expect(r.date, `${r.personId} date has wiki markup`).not.toMatch(/QS:|\{\{/);
      expect(r.verifiedOn, `${r.personId} verifiedOn`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
  it('every portrait has a request entry on the same Commons title (reproducible fetch)', () => {
    const titles = new Map(portraitReq.requests.map((q) => [q.personId, q.title]));
    for (const r of commonsRec) expect(titles.get(r.personId), r.personId).toBe(r.pageTitle);
  });
  it('a portrait from outside Commons states its source and how its rights were worked out', () => {
    expect(otherRec.length).toBeGreaterThan(0);
    for (const r of otherRec) {
      expect(r.source, r.personId).toBeTruthy();
      expect(r.rightsStatement?.length, `${r.personId} rightsStatement`).toBeGreaterThan(40);
      expect(allow.has(r.license) || /^Public domain/.test(r.license), `${r.personId} license`).toBe(true);
      expect(commonsRec.some((c) => c.personId === r.personId), `${r.personId} also on Commons`).toBe(false);
    }
  });
  it('a person shown without a portrait carries the reason it was not found', () => {
    for (const g of portraitGaps) {
      const p = ds.people.find((x) => x.id === g.personId);
      expect(p.portrait, g.personId).toBeNull();
      expect(p.portraitGap?.why, g.personId).toBe(g.why);
    }
  });
  it('no unreferenced portrait files', () => {
    const files = new Set(withPortrait.map((p) => p.portrait.file.replace('portraits/', '')));
    for (const f of readdirSync(join(root, 'public/portraits'))) expect(files.has(f), `orphan ${f}`).toBe(true);
  });
  it('the size stated in each credit line is the size of the file we serve', () => {
    for (const r of rec) {
      const { width, height } = imageSize(readFileSync(join(root, 'public', r.file)));
      expect(r.scaled, r.personId).toContain(`${width}×${height} px`.replace('×', r.source ? 'x' : '×'));
    }
  });
  it('portrait files are optimised (under 120 kB)', () => {
    for (const r of rec) expect(statSync(join(root, 'public', r.file)).size, r.file).toBeLessThan(120_000);
  });
  it('people without a verified portrait have none recorded, and each says why in portrait-gaps.json (relatives named only through a family link get initials; no portrait is sought for them)', () => {
    const gaps = JSON.parse(readFileSync(join(root, 'data/portrait-gaps.json'), 'utf8'));
    const gapIds = new Set(gaps.map((g) => g.personId));
    for (const p of ds.people) {
      if (p.relative) continue;
      if (p.portrait) expect(gapIds.has(p.id), `${p.id} has a portrait and a gap entry`).toBe(false);
      else {
        expect(gapIds.has(p.id), `${p.id} has no portrait and no recorded reason`).toBe(true);
        const g = gaps.find((x) => x.personId === p.id);
        expect(g.searched.length, `${p.id} searched`).toBeGreaterThan(10);
        expect(g.why.length, `${p.id} why`).toBeGreaterThan(10);
      }
    }
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
