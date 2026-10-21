import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = join(dirname(fileURLToPath(import.meta.url)), '../..');
const book = join(repo, 'books/cardinal');
const reviews = join(repo, 'site/corpus/podcast');

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function idOf(claim, source) {
  let h = 2166136261;
  const s = `${claim}|${source}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

function parseBib(raw) {
  const entries = [];
  for (const chunk of raw.split(/\n(?=@)/)) {
    const head = chunk.match(/^@(\w+)\s*\{\s*([^,\s]+)\s*,/);
    if (!head) continue;
    const fields = {};
    let i = head[0].length;
    while (i < chunk.length) {
      const slice = chunk.slice(i);
      const m = /^[ \t\r\n,]*([A-Za-z][\w-]*)\s*=\s*/.exec(slice);
      if (!m) break;
      i += m.index + m[0].length;
      let value = '';
      if (chunk[i] === '{') {
        let depth = 0;
        const start = i;
        for (; i < chunk.length; i++) {
          if (chunk[i] === '{') depth += 1;
          else if (chunk[i] === '}') {
            depth -= 1;
            if (depth === 0) {
              i += 1;
              break;
            }
          }
        }
        value = chunk.slice(start + 1, i - 1);
      } else break;
      fields[m[1].toLowerCase()] = value.replace(/[{}]/g, '').replace(/\s+/g, ' ').trim();
    }
    entries.push({
      title: fields.title || '',
      author: fields.author || '',
      year: fields.year || '',
      pages: fields.pages || '',
      url: (fields.url || '').trim(),
      note: fields.note || '',
    });
  }
  return entries;
}

function tables(md) {
  const lines = md.split('\n');
  const found = [];
  let section = '';
  let headers = null;
  for (const line of lines) {
    const heading = line.match(/^#{2,3}\s+(.+)/);
    if (heading) {
      section = heading[1].trim();
      headers = null;
      continue;
    }
    if (!line.startsWith('|')) {
      headers = null;
      continue;
    }
    const cells = line.split('|').slice(1, -1).map((c) => c.trim());
    if (!cells.length || cells.every((c) => /^:?-+:?$/.test(c))) continue;
    if (!headers) {
      headers = cells.map((c) => c.toLowerCase());
      continue;
    }
    const row = {};
    headers.forEach((h, i) => {
      row[h] = cells[i] || '';
    });
    found.push({ section, row });
  }
  return found;
}

function foundIn(source) {
  const bits = [];
  const page = source.match(/\b(?:p|pp)\.?\s*\d[\d–-]*/i);
  const ch = source.match(/\b(?:ch\.|chapter)\s*[\d.]+/i);
  const sec = source.match(/\b(?:introduction|preface|appendix|section|§)\b[^,;|]*/i);
  if (page) bits.push(page[0]);
  if (ch) bits.push(ch[0]);
  if (sec) bits.push(sec[0].trim());
  return bits.join('; ');
}

function matchBib(source, claim, bibs) {
  const hay = norm(`${source} ${claim}`);
  const hits = bibs.filter((b) => {
    const title = norm(b.title);
    if (title.length > 22 && hay.includes(title)) return true;
    const author = norm(b.author);
    if (author.length > 18 && hay.includes(author)) return true;
    return false;
  });
  return hits.length === 1 ? hits[0] : null;
}

const chapters = readdirSync(join(book, 'ch'))
  .filter((name) => name.endsWith('.qmd'))
  .map((name) => ({
    name,
    href: `/research/draft/${name.replace(/\.qmd$/, '')}`,
    text: norm(readFileSync(join(book, 'ch', name), 'utf8')),
  }));

function chapterLink(claim) {
  const needle = norm(claim).slice(0, 70);
  if (needle.length < 24) return null;
  const hits = chapters.filter((ch) => ch.text.includes(needle));
  return hits.length === 1 ? hits[0] : null;
}

const bibs = parseBib(readFileSync(join(book, 'references.bib'), 'utf8'));
const rows = [];

function push(row) {
  rows.push({
    id: idOf(row.claim, row.source),
    ...row,
  });
}

for (const file of readdirSync(reviews).filter((name) => name.endsWith('-review.md'))) {
  const n = Number(file.slice(2, 4));
  const md = readFileSync(join(reviews, file), 'utf8');
  for (const { section, row } of tables(md)) {
    if (row.claim && row.source) {
      const bib = matchBib(row.source, row.claim, bibs);
      const chapter = chapterLink(row.claim);
      push({
        claim: row.claim,
        source: row.source,
        found: foundIn(row.source),
        link: bib?.url || '',
        linkLabel: bib ? bib.title : '',
        status: row.status || '',
        why: row.status || '',
        usedHref: chapter ? chapter.href : `/episodes/${n}#sources`,
        usedLabel: chapter
          ? `Draft ${chapter.name.replace(/\.qmd$/, '')}`
          : `Episode ${String(n).padStart(2, '0')} sources`,
        log: `Episode ${n} review, ${section}`,
      });
    } else if (row.item && row.why && /cut/i.test(section)) {
      push({
        claim: row.item,
        source: row.why,
        found: foundIn(row.why),
        link: '',
        linkLabel: '',
        status: 'CUT',
        why: row.why,
        usedHref: `/episodes/${n}#sources`,
        usedLabel: `Episode ${String(n).padStart(2, '0')} sources`,
        log: `Episode ${n} review, ${section}`,
      });
    }
  }
}

const logMd = readFileSync(join(book, '_project/research-log.md'), 'utf8');
for (const { section, row } of tables(logMd)) {
  if (row.claim && row.source && row.status) {
    const bib = matchBib(row.source, row.claim, bibs);
    const chapter = chapterLink(row.claim);
    push({
      claim: row.claim,
      source: row.source,
      found: foundIn(row.source),
      link: bib?.url || '',
      linkLabel: bib ? bib.title : '',
      status: row.status,
      why: row.status,
      usedHref: chapter ? chapter.href : '/research/apparatus/research-log',
      usedLabel: chapter ? `Draft ${chapter.name.replace(/\.qmd$/, '')}` : 'Research log',
      log: section,
    });
  } else if (row.claim && row.note && row.chapter) {
    const chapter = chapterLink(row.claim);
    push({
      claim: row.claim,
      source: row.note,
      found: row.chapter,
      link: '',
      linkLabel: '',
      status: 'CONTESTED',
      why: row.note,
      usedHref: chapter ? chapter.href : '/research/apparatus/research-log',
      usedLabel: chapter ? `Draft ${chapter.name.replace(/\.qmd$/, '')}` : `Research log, ${row.chapter}`,
      log: section,
    });
  } else if (row.claim && row.correction) {
    push({
      claim: row.claim,
      source: row.correction,
      found: '',
      link: '',
      linkLabel: '',
      status: 'CORRECTION',
      why: row.correction,
      usedHref: '/research/apparatus/research-log',
      usedLabel: 'Research log',
      log: section,
    });
  }
}

writeFileSync(join(repo, 'site/src/data/citations.json'), JSON.stringify(rows, null, 2));
const linked = rows.filter((r) => r.link).length;
console.log(`citations ${rows.length}, with a matched link ${linked}`);
