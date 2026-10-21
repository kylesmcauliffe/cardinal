import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const shotsDir = join(root, 'public/sources');
mkdirSync(shotsDir, { recursive: true });
const rows = JSON.parse(readFileSync(join(root, 'src/data/citations.json'), 'utf8'));
const captured = '2026-10-21';
const UA = 'CardinalSite/1.0 (citation passage check)';

function allowed(url) {
  try {
    const host = new URL(url).hostname;
    if (host.endsWith('.gov')) return true;
    if (host === 'blogs.baylor.edu' || host === 'sjsu.edu' || host.endsWith('.sjsu.edu')) return true;
    if (host === 'npshistory.com' || host === 'cprr.org' || host.endsWith('.loc.gov')) return true;
    if (host === 'facts.stanford.edu') return true;
    return false;
  } catch {
    return false;
  }
}

function textOf(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#8217;|&rsquo;/g, "'")
    .replace(/&#\d+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function passage(pageText, claim) {
  const words = claim
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3);
  for (let n = 6; n >= 3; n--) {
    for (let i = 0; i <= words.length - n; i++) {
      const phrase = words.slice(i, i + n).join(' ');
      const at = pageText.toLowerCase().indexOf(phrase);
      if (at < 0) continue;
      const start = pageText.lastIndexOf('. ', at);
      const endStop = pageText.indexOf('. ', at + phrase.length);
      const from = start >= 0 && at - start < 280 ? start + 2 : Math.max(0, at - 80);
      const to = endStop > 0 && endStop - at < 320 ? endStop + 1 : Math.min(pageText.length, at + phrase.length + 140);
      const excerpt = pageText.slice(from, to).trim();
      if (excerpt.length < 40 || excerpt.length > 420) continue;
      return { excerpt, phrase };
    }
  }
  return null;
}

function esc(s) {
  return s.replace(/[&<>]/g, (c) => (c === '&' ? '&amp;' : c === '<' ? '&lt;' : '&gt;'));
}

async function shoot(html, file) {
  const tmp = `/tmp/passage-${file}.html`;
  writeFileSync(tmp, html);
  await new Promise((resolve, reject) => {
    const chrome = spawn('google-chrome', [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--window-size=720,480',
      '--screenshot=' + join(shotsDir, file),
      'file://' + tmp,
    ]);
    const timer = setTimeout(() => {
      chrome.kill();
      resolve();
    }, 12000);
    chrome.on('exit', () => {
      clearTimeout(timer);
      resolve();
    });
    chrome.on('error', reject);
  });
}

const shots = {};
const cache = new Map();
let made = 0;
for (const row of rows) {
  if (!row.link || !allowed(row.link)) continue;
  if (!cache.has(row.link)) {
    try {
      const res = await fetch(row.link, { headers: { 'User-Agent': UA }, redirect: 'follow' });
      cache.set(row.link, res.ok ? textOf(await res.text()) : '');
    } catch {
      cache.set(row.link, '');
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  const page = cache.get(row.link);
  if (!page) continue;
  const hit = passage(page, row.claim);
  if (!hit) {
    console.log('NO PHRASE', row.id, row.link);
    continue;
  }
  const html = `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#f4ece4;color:#1c0d10;font:18px Palatino,serif;width:680px"><p style="margin:18px 20px;line-height:1.45">${esc(hit.excerpt).replace(new RegExp(esc(hit.phrase), 'i'), (m) => `<mark style="background:#8c1515;color:#f6efe9">${m}</mark>`)}</p><p style="margin:0 20px 16px;font:12px sans-serif">Captured ${captured}. ${esc(row.link)}</p></body>`;
  const file = `${row.id}.png`;
  await shoot(html, file);
  shots[row.id] = { file: `/sources/${file}`, captured, passage: hit.excerpt };
  made += 1;
  console.log('SHOT', row.id, hit.excerpt.slice(0, 80));
}
writeFileSync(join(root, 'src/data/source-shots.json'), JSON.stringify(shots, null, 2));
console.log('shots', made);
