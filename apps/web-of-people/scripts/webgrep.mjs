#!/usr/bin/env node
// Research helper: node scripts/webgrep.mjs <url> <regex> [context=160]
// Prints each match with surrounding text from the normalised page text, so a
// verbatim quote can be copied exactly. Add --fresh to bypass the local cache.
import { pageText } from './lib/webtext.mjs';

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const fresh = process.argv.includes('--fresh');
const [url, pattern, ctx = '160'] = args;
if (!url) { console.error('usage: webgrep.mjs <url> <regex> [context]'); process.exit(2); }
const p = await pageText(url, { fresh });
console.log(`HTTP ${p.status} ${p.ok ? 'ok' : 'FAILED'} ${p.error ?? ''} chars=${p.text.length} final=${p.finalUrl}`);
if (!p.ok) process.exit(1);
if (!pattern) { console.log(p.text.slice(0, 3000)); process.exit(0); }
const re = new RegExp(pattern, 'gi');
let m; let n = 0;
while ((m = re.exec(p.text)) && n < 12) {
  const a = Math.max(0, m.index - +ctx); const b = Math.min(p.text.length, m.index + m[0].length + +ctx);
  console.log(`\n--- match ${++n} @${m.index}\n${p.text.slice(a, b)}`);
  if (m[0].length === 0) re.lastIndex++;
}
if (!n) console.log('no match');
