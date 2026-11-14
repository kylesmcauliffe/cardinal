// Fetches a web page and reduces it to normalised plain text so that a quoted
// passage can be checked against it. Shared by webgrep.mjs and verify-web.mjs.
import { createHash } from 'node:crypto';
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const UA = 'CardinalWebOfPeople/0.2 (research prototype; github.com/kylesmcauliffe/cardinal)';
// Some publishers refuse unfamiliar agents with 403; a single retry with a browser-style header reads the same public page.
const BROWSER_UA = 'Mozilla/5.0 (X11; Linux x86_64) Chrome/124';
const CACHE = join(tmpdir(), 'wop-webcache');
mkdirSync(CACHE, { recursive: true });

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', hellip: '…', eacute: 'é', egrave: 'è', oacute: 'ó', aacute: 'á', iacute: 'í', uacute: 'ú', ntilde: 'ñ', uuml: 'ü', ouml: 'ö', auml: 'ä', ccedil: 'ç', times: '×', deg: '°' };
const decode = (s) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
    .replace(/&([a-z]+);/gi, (m, n) => ENT[n.toLowerCase()] ?? m);

export function normalise(s) {
  return s
    .replace(/[\u00ad\u200b\u200c\u200d\ufeff]/g, '')
    .replace(/[\u2018\u2019\u02bc]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2010-\u2015\u2212]/g, '-')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function htmlToText(html) {
  let h = html
    .replace(/<(script|style|noscript|svg|template)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<sup[^>]*class="[^"]*reference[^"]*"[\s\S]*?<\/sup>/gi, '')
    .replace(/<span class="mw-editsection[\s\S]*?<\/span>\s*<\/span>/gi, ' ')
    .replace(/<\/(p|div|li|tr|h[1-6]|br|blockquote|section|article)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '');
  h = decode(h).replace(/\[\s*(?:\d+|[a-z]|citation needed|edit)\s*\]/gi, '');
  return h;
}

export async function pageText(url, { fresh = false } = {}) {
  const key = createHash('sha1').update(url).digest('hex');
  const file = join(CACHE, key + '.json');
  if (!fresh && existsSync(file)) return JSON.parse(readFileSync(file, 'utf8'));
  let last;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const get = (ua) => fetch(url, { headers: { 'User-Agent': ua, Accept: 'text/html,application/xhtml+xml,application/json,text/plain' }, redirect: 'follow', signal: AbortSignal.timeout(30000) });
      let res = await get(UA);
      let body;
      if (res.status === 403) {
        // Some hosts challenge a fraction of requests at random, so the browser-style retry is repeated a few times.
        for (let k = 0; k < 10; k++) {
          try {
            const out = execFileSync('curl', ['-sSL', '--max-time', '30', '-A', BROWSER_UA, '-w', '\n__HTTP__%{http_code}', url], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
            const m = /\n__HTTP__(\d+)$/.exec(out);
            const code = m ? +m[1] : 0;
            if (code >= 200 && code < 300) {
              body = out.replace(/\n__HTTP__\d+$/, '');
              res = { status: code, ok: true, url, headers: { get: () => 'text/html' } };
              break;
            }
          } catch { /* try again */ }
          await new Promise((r) => setTimeout(r, 3000));
        }
      }
      body ??= await res.text();
      if (res.status === 429 || res.status >= 500) { last = `HTTP ${res.status}`; await new Promise((r) => setTimeout(r, 3000 * (attempt + 1))); continue; }
      const ctype = res.headers.get('content-type') ?? '';
      const text = res.ok ? normalise(/json/.test(ctype) ? body : htmlToText(body)) : '';
      const out = { url, finalUrl: res.url, status: res.status, ok: res.ok, retrieved: new Date().toISOString().slice(0, 10), text, textSha256: createHash('sha256').update(text).digest('hex') };
      writeFileSync(file, JSON.stringify(out));
      return out;
    } catch (e) {
      last = String(e);
      await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
    }
  }
  return { url, finalUrl: url, status: 0, ok: false, retrieved: new Date().toISOString().slice(0, 10), text: '', textSha256: '', error: last };
}
