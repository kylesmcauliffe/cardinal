#!/usr/bin/env node
// Checks every external citation: the URL must resolve and the quoted passage must
// appear in the page text (normalised for whitespace, quote marks and dashes).
//   node scripts/verify-web.mjs                 verify curated.json + research.json, write data/web-verification.json
//   node scripts/verify-web.mjs file.json ...   check findings files only (no write); exits 1 on any failure
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pageText, normalise } from './lib/webtext.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const files = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const fresh = process.argv.includes('--fresh');

function collect(node, out) {
  if (Array.isArray(node)) node.forEach((n) => collect(n, out));
  else if (node && typeof node === 'object') {
    if (typeof node.url === 'string' && typeof node.q === 'string') out.push(node);
    for (const v of Object.values(node)) collect(v, out);
  }
  return out;
}

const sources = files.length ? files : [join(root, 'data/curated.json'), join(root, 'data/research.json')];
const cites = sources.flatMap((f) => collect(JSON.parse(readFileSync(f, 'utf8')), []));
const byUrl = new Map();
for (const c of cites) {
  if (!byUrl.has(c.url)) byUrl.set(c.url, new Set());
  byUrl.get(c.url).add(c.q);
}
const entries = [];
let bad = 0;
for (const [url, qs] of [...byUrl].sort(([a], [b]) => a.localeCompare(b))) {
  const p = await pageText(url, { fresh });
  const hay = p.text;
  const quotes = [...qs].sort().map((q) => {
    const found = p.ok && hay.includes(normalise(q));
    if (!found) { bad++; console.log(`FAIL ${url}\n   ${p.ok ? 'quote not found' : 'HTTP ' + p.status + ' ' + (p.error ?? '')}: "${q}"`); }
    return { qSha256: createHash('sha256').update(normalise(q)).digest('hex'), q: q.slice(0, 60), found };
  });
  entries.push({ url, httpStatus: p.status, retrieved: p.retrieved, pageTextSha256: p.textSha256, quotes });
}
console.log(`${cites.length} citations, ${byUrl.size} URLs, ${bad} failures`);
if (!files.length) {
  writeFileSync(join(root, 'data/web-verification.json'), JSON.stringify({ note: 'Written by scripts/verify-web.mjs. Each external quote was found in the page text on the retrieved date. Pages can change; re-run to re-check.', entries }, null, 2) + '\n');
}
process.exit(bad ? 1 : 0);
