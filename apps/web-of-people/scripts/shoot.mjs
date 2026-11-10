/**
 * Process screenshots. Usage:
 *   node scripts/shoot.mjs mockups   -> mockups/png/*.png and a copy in process/02-mockups/
 *   node scripts/shoot.mjs app       -> process/03-app/*.png (needs `npm run build` first)
 *   node scripts/shoot.mjs <name> <path> <width> [height]   -> one ad-hoc shot into process/_tmp/
 * Uses the system Chrome through playwright-core. Motion is reduced so shots are repeatable.
 */
import { chromium } from 'playwright-core';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { startServer } from './lib/static-server.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = process.env.CHROME_PATH || '/usr/local/bin/google-chrome';
const mode = process.argv[2] || 'app';

async function browser() {
  return chromium.launch({ executablePath: existsSync(CHROME) ? CHROME : undefined, args: ['--no-sandbox'] });
}

async function context(b, w, h) {
  const mobile = w < 600;
  return b.newContext({
    viewport: { width: w, height: h },
    deviceScaleFactor: mobile ? 2 : 1,
    hasTouch: mobile,
    isMobile: mobile,
    reducedMotion: 'reduce',
  });
}

async function settle(page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(700);
}

async function mockups() {
  const dir = join(root, 'mockups');
  const png = join(dir, 'png');
  const proc = join(root, 'process', '02-mockups');
  mkdirSync(png, { recursive: true });
  mkdirSync(proc, { recursive: true });
  const pages = ['web', 'web-open', 'profile', 'family', 'surname-place'];
  const b = await browser();
  for (const [label, w, h] of [['desktop', 1280, 900], ['mobile', 390, 844]]) {
    const ctx = await context(b, w, h);
    for (const name of pages) {
      const page = await ctx.newPage();
      await page.goto(pathToFileURL(join(dir, name + '.html')).href);
      await settle(page);
      const file = join(png, `${name}-${label}.png`);
      await page.screenshot({ path: file, fullPage: true });
      if (['web', 'profile', 'family'].includes(name)) copyFileSync(file, join(proc, `${name}-${label}.png`));
      console.log('shot', file);
      await page.close();
    }
    await ctx.close();
  }
  await b.close();
}

const NODE = (n) => `g.node[aria-label^="${n}"]`;

const APP_SHOTS = [
  { name: '01-web-desktop', path: '/', w: 1440, h: 1000 },
  { name: '02-web-profile-open-desktop', path: '/', w: 1440, h: 1000, run: async (p) => { await p.locator(NODE('Herbert Hoover')).click({ force: true }); await p.waitForTimeout(500); } },
  { name: '03-web-by-time-desktop', path: '/', w: 1440, h: 1000, run: async (p) => { await p.locator('input[data-t="time"]').check(); await p.waitForTimeout(900); } },
  { name: '04-web-mobile', path: '/', w: 390, h: 844 },
  { name: '05-web-sheet-mobile', path: '/?p=leland-stanford', w: 390, h: 844 },
  { name: '06-profile-desktop', path: '/people/leland-stanford/', w: 1280, h: 900, full: true },
  { name: '07-profile-mobile', path: '/people/herbert-hoover/', w: 390, h: 844, full: true },
  { name: '08-family-desktop', path: '/family/leland-stanford/', w: 1280, h: 900, full: true },
  { name: '09-family-mobile', path: '/family/frederick-terman/', w: 390, h: 844, full: true },
  { name: '10-surname-desktop', path: '/surnames/stanford/', w: 1280, h: 900, full: true },
  { name: '11-place-desktop', path: '/places/stanford-ca/', w: 1280, h: 900, full: true },
  { name: '12-charts-desktop', path: '/charts/', w: 1280, h: 900, full: true },
  { name: '13-charts-mobile', path: '/charts/', w: 390, h: 844, full: true },
  { name: '14-import-desktop', path: '/import/', w: 1280, h: 900, full: true, run: async (p) => { await p.click('#sample'); await p.waitForTimeout(900); } },
  { name: '15-import-mobile', path: '/import/', w: 390, h: 844, full: true, run: async (p) => { await p.click('#sample'); await p.waitForTimeout(900); } },
  { name: '16-people-mobile', path: '/people/', w: 390, h: 844, full: true },
];

async function app(outDir, only) {
  mkdirSync(outDir, { recursive: true });
  const srv = await startServer(join(root, 'dist'));
  const b = await browser();
  try {
    for (const s of APP_SHOTS) {
      if (only && !s.name.includes(only)) continue;
      const ctx = await context(b, s.w, s.h);
      const page = await ctx.newPage();
      await page.goto(srv.url + s.path, { waitUntil: 'networkidle' });
      await settle(page);
      if (s.run) await s.run(page);
      const file = join(outDir, s.name + '.png');
      await page.screenshot({ path: file, fullPage: !!s.full });
      console.log('shot', file);
      await ctx.close();
    }
  } finally {
    await b.close();
    await srv.close();
  }
}

if (mode === 'mockups') await mockups();
else if (mode === 'app') await app(join(root, 'process', process.argv[3] || '03-app'), process.argv[4]);
else {
  const [, , name, path, w = '1280', h = '900'] = process.argv;
  const srv = await startServer(join(root, 'dist'));
  const b = await browser();
  const ctx = await context(b, +w, +h);
  const page = await ctx.newPage();
  await page.goto(srv.url + path, { waitUntil: 'networkidle' });
  await settle(page);
  mkdirSync(join(root, 'process', '_tmp'), { recursive: true });
  await page.screenshot({ path: join(root, 'process', '_tmp', name + '.png'), fullPage: true });
  await b.close();
  await srv.close();
}
