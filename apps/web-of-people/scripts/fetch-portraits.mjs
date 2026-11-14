#!/usr/bin/env node
// Reproducible portrait fetch. Reads data/portrait-requests.json, asks the
// Wikimedia Commons API for license + attribution, downloads a scaled thumbnail,
// and writes data/portraits.json. Anything outside the license allowlist is refused.
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { imageSize, scaledNote } from './lib/imgsize.mjs';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const UA = 'CardinalWebOfPeople/0.1 (research prototype; github.com/kylesmcauliffe/cardinal)';
const WIDTH = 360; // requested; Commons serves its nearest standard thumbnail size (usually 500 px), or the original when that is smaller
const req = JSON.parse(await readFile(join(root, 'data/portrait-requests.json'), 'utf8'));
const allow = new Set(req.licenseAllowlist);
const strip = (s = '') =>
  s.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/\s+/g, ' ').trim();

await mkdir(join(root, 'public/portraits'), { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function politeFetch(url, asJson) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    const buf = Buffer.from(await res.arrayBuffer());
    if (res.ok) {
      if (!asJson) return buf;
      try { return JSON.parse(buf.toString('utf8')); } catch { /* rate-limit text */ }
    }
    await sleep(4000 * (attempt + 1));
  }
  throw new Error(`giving up on ${url}`);
}
const cleanDate = (d) => d.replace(/\s*date QS:.*$/i, '').replace(/\s*\{\{.*$/, '').replace(/^between (\d{4}) and (\d{4})$/, 'between $1 and $2').trim();
const cleanAuthor = (a) => {
  const t = a.replace(/^(Unknown author\s*)+$/i, 'Unknown author').trim();
  return (t || 'Unknown author').slice(0, 160);
};
const out = [];
const refused = [];
const only = process.env.ONLY ? new Set(process.env.ONLY.split(',')) : null;
const prev = (() => { try { return JSON.parse(readFileSync(join(root, 'data/portraits.json'), 'utf8')); } catch { return []; } })();
for (const r of req.requests) {
  if (only && !only.has(r.personId)) { const k = prev.find((p) => p.personId === r.personId); if (k) out.push(k); continue; }
  const u = new URL('https://commons.wikimedia.org/w/api.php');
  u.search = new URLSearchParams({
    action: 'query', format: 'json', titles: r.title, prop: 'imageinfo',
    iiprop: 'url|size|mime|extmetadata', iiurlwidth: String(WIDTH),
  });
  await sleep(1500);
  const j = await politeFetch(u, true);
  const page = Object.values(j.query.pages)[0];
  const info = page?.imageinfo?.[0];
  if (!info) { refused.push([r.personId, 'file not found']); continue; }
  const m = info.extmetadata ?? {};
  const license = strip(m.LicenseShortName?.value);
  if (!allow.has(license)) { refused.push([r.personId, `license "${license}" not allowed`]); continue; }
  if (!/^image\/(jpeg|png|tiff)$/.test(info.mime)) { refused.push([r.personId, `mime ${info.mime}`]); continue; }
  await sleep(1500);
  const bin = await politeFetch(info.thumburl, false);
  const ext = /\.png$/i.test(info.thumburl) ? 'png' : 'jpg';
  const file = `portraits/${r.personId}.${ext}`;
  await writeFile(join(root, 'public', file), bin);
  out.push({
    personId: r.personId,
    file,
    pageTitle: page.title,
    pageUrl: info.descriptionurl,
    author: cleanAuthor(strip(m.Artist?.value)),
    credit: strip(m.Credit?.value),
    date: cleanDate(strip(m.DateTimeOriginal?.value)),
    fileUrl: info.url.replace(/\?.*$/, ''),
    ...(r.medium ? { medium: r.medium } : {}),
    ...(r.subjectEvidence ? { subjectEvidence: r.subjectEvidence } : {}),
    verifiedOn: new Date().toISOString().slice(0, 10),
    license,
    licenseUrl: strip(m.LicenseUrl?.value) || null,
    description: strip(m.ImageDescription?.value).slice(0, 300),
    scaled: scaledNote({ width: info.width, height: info.height }, imageSize(bin)),
    sha256: createHash('sha256').update(bin).digest('hex'),
    retrieved: new Date().toISOString().slice(0, 10),
  });
  console.log('ok', r.personId, license);
}
await writeFile(join(root, 'data/portraits.json'), JSON.stringify(out, null, 2) + '\n');
if (refused.length) console.log('REFUSED', refused);
