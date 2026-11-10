import { describe, it, expect, beforeAll } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ds = JSON.parse(readFileSync(join(root, 'data/dataset.json'), 'utf8'));

function cleanEnv() {
  // Vitest exports BASE_URL, MODE, NODE_ENV and friends; they would leak into the Astro child build.
  const env = { ...process.env };
  for (const k of Object.keys(env)) if (/^(BASE_URL|MODE|DEV|PROD|SSR|NODE_ENV|VITEST.*|VITE_.*)$/.test(k)) delete env[k];
  return env;
}

function build(base) {
  const out = mkdtempSync(join(tmpdir(), 'wop-'));
  execFileSync('npx', ['astro', 'build', '--outDir', out], {
    cwd: root,
    env: { ...cleanEnv(), WOP_BASE: base, ASTRO_TELEMETRY_DISABLED: '1' },
    stdio: 'pipe',
  });
  return out;
}

function walk(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

function internalLinks(html, base) {
  const out = [];
  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    let u = m[1].replace(/&amp;/g, '&');
    if (/^(https?:|mailto:|data:|#|\?|javascript:)/.test(u)) continue;
    u = u.split('#')[0].split('?')[0];
    if (!u) continue;
    out.push(u);
  }
  return out;
}

function resolves(out, base, u) {
  if (!u.startsWith(base)) return false;
  const rel = decodeURIComponent(u.slice(base.length));
  const p = join(out, rel);
  if (existsSync(p) && statSync(p).isFile()) return true;
  return existsSync(join(p, 'index.html'));
}

describe.each([['/'], ['/wop/']])('static build with base %s', (base) => {
  let out;
  beforeAll(() => {
    out = build(base);
  }, 120000);

  it('emits every route in the URL sheet', () => {
    const must = ['', 'people/', 'family/', 'surnames/', 'places/', 'charts/', 'import/', 'sources/', '404.html'];
    for (const r of must) expect(existsSync(join(out, r, r.endsWith('.html') ? '' : 'index.html')), r).toBe(true);
    for (const p of ds.people) expect(existsSync(join(out, 'people', p.id, 'index.html')), p.id).toBe(true);
    for (const p of ds.places) expect(existsSync(join(out, 'places', p.id, 'index.html')), p.id).toBe(true);
  });

  it('has no broken internal links or assets', () => {
    const broken = [];
    let checked = 0;
    for (const f of walk(out).filter((f) => f.endsWith('.html'))) {
      const html = readFileSync(f, 'utf8');
      for (const u of internalLinks(html, base)) {
        checked++;
        if (!resolves(out, base, u)) broken.push(`${f.replace(out, '')} -> ${u}`);
      }
    }
    expect(checked).toBeGreaterThan(500);
    expect(broken.slice(0, 10)).toEqual([]);
  });

  it('serves portraits and fonts from the right base', () => {
    const html = readFileSync(join(out, 'people/leland-stanford/index.html'), 'utf8');
    expect(html).toContain(`${base}portraits/leland-stanford.jpg`);
    expect(html).toContain(`${base}fonts/fonts.css`);
  });

  it('marks every page noindex so a preview deploy cannot be indexed', () => {
    for (const f of walk(out).filter((f) => f.endsWith('.html'))) {
      expect(readFileSync(f, 'utf8'), f).toContain('name="robots" content="noindex"');
    }
  });
});
