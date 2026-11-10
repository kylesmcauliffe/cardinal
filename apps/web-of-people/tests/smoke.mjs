/**
 * Browser smoke test: drives the built site in Chrome at desktop and phone widths.
 * Needs `npm run build` first. Exits non-zero on any failed check.
 */
import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer } from '../scripts/lib/static-server.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = process.env.CHROME_PATH || '/usr/local/bin/google-chrome';
if (!existsSync(join(root, 'dist/index.html'))) {
  console.error('dist/ is missing. Run `npm run build` first.');
  process.exit(2);
}

const results = [];
function check(name, ok, extra = '') {
  results.push({ name, ok, extra });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : '  ' + extra}`);
}

const srv = await startServer(join(root, 'dist'));
const browser = await chromium.launch({ executablePath: existsSync(CHROME) ? CHROME : undefined, args: ['--no-sandbox'] });

const GED = `0 HEAD
1 GEDC
2 VERS 5.5.1
1 CHAR UTF-8
0 @I1@ INDI
1 NAME Test /Parent/
1 BIRT
2 DATE 1900
1 DEAT
2 DATE 1970
0 @I2@ INDI
1 NAME Test /Child/
1 BIRT
2 DATE 1930
1 DEAT
2 DATE 2001
0 @I3@ INDI
1 NAME Still /Living/
1 BIRT
2 DATE 1995
0 @F1@ FAM
1 HUSB @I1@
1 CHIL @I2@
0 TRLR
`;

const nodeSel = (name) => `g.node[aria-label^="${name}"]`;
const tx = async (page, sel) =>
  page.locator(sel).evaluate((el) => {
    const m = /translate\(([-\d.e]+)[ ,]([-\d.e]+)\)/.exec(el.getAttribute('transform'));
    return { x: +m[1], y: +m[2] };
  });

async function run(label, width, height) {
  const mobile = width < 600;
  const ctx = await browser.newContext({ viewport: { width, height }, hasTouch: mobile, isMobile: mobile, deviceScaleFactor: mobile ? 2 : 1 });
  const issues = [];
  const watch = (page) => {
    page.on('console', (m) => {
      if (m.type() === 'error') issues.push(`console error: ${m.text()}`);
    });
    page.on('pageerror', (e) => issues.push(`page error: ${e.message}`));
    page.on('requestfailed', (r) => issues.push(`request failed: ${r.url()}`));
    page.on('response', (r) => {
      if (r.status() >= 400 && !r.url().endsWith('/definitely-missing/')) issues.push(`HTTP ${r.status()}: ${r.url()}`);
    });
  };
  const open = async (path) => {
    const page = await ctx.newPage();
    watch(page);
    await page.goto(srv.url + path, { waitUntil: 'networkidle' });
    return page;
  };
  const noOverflow = async (page, name) => {
    const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
    check(`[${label}] ${name}: no horizontal page overflow`, o.sw <= o.iw + 1, `${o.sw} > ${o.iw}`);
  };

  /* web */
  let page = await open('/');
  await page.waitForSelector('g.node');
  const count = await page.locator('g.node').count();
  check(`[${label}] web renders a bubble per person`, count === 57, `got ${count}`);
  check(`[${label}] web draws place hubs and links`, (await page.locator('g.hub').count()) > 3 && (await page.locator('line.link').count()) > 50);
  check(`[${label}] web has portraits and initials bubbles`, (await page.locator('g.node image').count()) > 20 && (await page.locator('g.node text.init').count()) > 5);
  await noOverflow(page, 'web');

  const hh = nodeSel('Herbert Hoover');
  const before = await tx(page, hh);
  await page.locator('.stage').scrollIntoViewIfNeeded();
  const box = await page.locator(hh).boundingBox();
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + 60, cy + 40, { steps: 6 });
  await page.mouse.move(cx + 120, cy + 70, { steps: 6 });
  await page.mouse.up();
  await page.waitForTimeout(150);
  const after = await tx(page, hh);
  const moved = Math.hypot(after.x - before.x, after.y - before.y);
  check(`[${label}] dragging a bubble moves it`, moved > 40, `moved ${moved.toFixed(1)}`);
  if (mobile) {
    const cdp = await ctx.newCDPSession(page);
    const b2 = await page.locator(hh).boundingBox();
    const sx = b2.x + b2.width / 2;
    const sy = b2.y + b2.height / 2;
    const t0 = await tx(page, hh);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: sx, y: sy }] });
    for (let i = 1; i <= 8; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: sx - i * 8, y: sy - i * 6 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(150);
    const t1 = await tx(page, hh);
    check(`[${label}] touch-dragging a bubble moves it`, Math.hypot(t1.x - t0.x, t1.y - t0.y) > 25, `moved ${Math.hypot(t1.x - t0.x, t1.y - t0.y).toFixed(1)}`);
  }
  check(`[${label}] a drag does not open a profile`, !(await page.locator('.drawer.open').count()));

  await page.locator(hh).click({ force: true });
  await page.waitForSelector('.drawer.open');
  const h2 = await page.locator('.drawer h2').first().textContent();
  check(`[${label}] clicking a bubble opens the profile`, /Herbert Hoover/.test(h2 ?? ''), h2 ?? '');
  check(`[${label}] profile url is shareable`, page.url().includes('p=herbert-hoover'), page.url());
  await page.waitForTimeout(450);
  const drawerBox = await page.locator('.drawer').boundingBox();
  check(`[${label}] profile panel is on screen`, drawerBox && drawerBox.x >= -1 && drawerBox.x + drawerBox.width <= width + 1 && drawerBox.height > 200, JSON.stringify(drawerBox));

  const total = await page.locator('.drawer .ev').count();
  await page.selectOption('.drawer [data-tl-status]', 'VERIFIED');
  const verified = await page.locator('.drawer .ev:not([hidden])').count();
  check(`[${label}] timeline status filter narrows the list`, verified > 0 && verified < total, `${verified}/${total}`);
  await page.selectOption('.drawer [data-tl-status]', '');
  await page.fill('.drawer [data-tl-q]', 'Branner');
  const searched = await page.locator('.drawer .ev:not([hidden])').count();
  check(`[${label}] timeline search narrows the list`, searched >= 1 && searched < total, `${searched}/${total}`);
  await page.fill('.drawer [data-tl-q]', '');
  const mark = page.locator('.drawer .tl-axis [data-ev]').first();
  await mark.dispatchEvent('click');
  check(`[${label}] selecting a timeline mark highlights its entry`, (await page.locator('.drawer .ev.is-on').count()) === 1);
  const spanBefore = await page.locator('.drawer .tl-axis .tick text').allTextContents();
  await page.locator('.drawer [data-tl-zoom="in"]').click();
  const spanAfter = await page.locator('.drawer .tl-axis .tick text').allTextContents();
  check(`[${label}] timeline zoom changes the axis`, spanBefore.join() !== spanAfter.join());
  const lane = page.locator('.drawer [data-tl-lane]');
  if (await lane.count()) {
    await lane.selectOption({ index: 1 });
    check(`[${label}] timeline can compare a second person`, (await page.locator('.drawer .tl-axis .lane-label').count()) === 2);
  }

  await page.locator('.drawer .fam-list a[data-person], .drawer .pill-list a[data-person]').first().click();
  await page.waitForTimeout(150);
  const h2b = await page.locator('.drawer h2').first().textContent();
  check(`[${label}] a person link inside the profile switches the profile`, !!h2b && !/Herbert Hoover/.test(h2b), h2b ?? '');

  await page.keyboard.press('Escape');
  await page.waitForTimeout(350);
  check(`[${label}] Escape closes the profile`, !(await page.locator('.drawer.open').count()));

  await page.fill('[data-q]', 'Leland Stanford');
  await page.press('[data-q]', 'Enter');
  await page.waitForSelector('.drawer.open');
  check(`[${label}] search opens the person`, /Leland Stanford/.test((await page.locator('.drawer h2').first().textContent()) ?? ''));
  await page.keyboard.press('Escape');

  await page.locator('input[data-t="time"]').check();
  await page.waitForTimeout(2200);
  const serra = await tx(page, nodeSel('Junípero Serra'));
  const musk = await tx(page, nodeSel('Elon Musk'));
  check(`[${label}] "arrange by time" puts earlier people to the left`, musk.x - serra.x > 100, `${serra.x.toFixed(0)} vs ${musk.x.toFixed(0)}`);
  await page.locator('input[data-t="places"]').uncheck();
  await page.waitForTimeout(300);
  check(`[${label}] place hubs toggle off removes hubs`, (await page.locator('g.hub').count()) === 0);
  await page.close();

  /* deep link */
  page = await open('/?p=leland-stanford');
  await page.waitForSelector('.drawer.open');
  check(`[${label}] deep link opens a profile`, /Leland Stanford/.test((await page.locator('.drawer h2').first().textContent()) ?? ''));
  await page.close();

  /* people list and profile page */
  page = await open('/people/');
  check(`[${label}] people list has 57 entries`, (await page.locator('#plist li').count()) === 57);
  await page.fill('#pf', 'hoover');
  check(`[${label}] people filter works`, (await page.locator('#plist li:not([hidden])').count()) === 2);
  await noOverflow(page, 'people');
  await page.close();

  page = await open('/people/leland-stanford/');
  check(`[${label}] profile page has name, timeline and family`, (await page.locator('h1').textContent()) === 'Leland Stanford' && (await page.locator('.tl-axis').count()) === 1 && (await page.locator('.fam-list').count()) >= 1);
  const evTotal = await page.locator('.ev').count();
  await page.selectOption('[data-tl-status]', 'NOT');
  const notV = await page.locator('.ev:not([hidden])').count();
  check(`[${label}] profile page timeline filter works`, notV > 0 && notV < evTotal);
  check(`[${label}] portrait credit is shown`, /Public domain/.test(await page.locator('.credit').textContent()));
  check(`[${label}] sources carry verbatim quotes`, (await page.locator('.ev .cite q').count()) >= evTotal);
  await noOverflow(page, 'profile');
  await page.close();

  page = await open('/people/peter-thiel/');
  check(`[${label}] a person without a portrait gets an initials bubble`, (await page.locator('.portrait.none .init').count()) === 1);
  check(`[${label}] unknowns are stated, not filled in`, /Birth: not recorded/.test(await page.locator('.gaps').textContent()));
  await page.close();

  /* family */
  page = await open('/family/leland-stanford/');
  check(`[${label}] family tree shows the Stanford cards`, (await page.locator('svg.tree .card').count()) === 3);
  await noOverflow(page, 'family');
  await page.close();
  page = await open('/family/collis-huntington/');
  check(`[${label}] family tree shows a placeholder for an unnamed relative`, (await page.locator('svg.tree .card.ghost').count()) === 1);
  await page.close();
  page = await open('/family/');
  check(`[${label}] family index lists families`, (await page.locator('.fam-cards a').count()) >= 5);
  await page.close();

  /* surnames, places, charts, sources */
  page = await open('/surnames/stanford/');
  check(`[${label}] surname page states the origin is not recorded`, /Not recorded/.test(await page.locator('.not-recorded').first().textContent()));
  await noOverflow(page, 'surname');
  await page.close();
  page = await open('/places/stanford-ca/');
  check(`[${label}] place page lists people and events`, (await page.locator('.pill-list a').count()) >= 3 && (await page.locator('.ev').count()) >= 3);
  await noOverflow(page, 'place');
  await page.close();
  page = await open('/charts/');
  check(`[${label}] charts page draws four charts`, (await page.locator('figure.chart svg').count()) === 4);
  await noOverflow(page, 'charts');
  await page.close();
  page = await open('/sources/');
  check(`[${label}] sources page lists the repository files`, (await page.locator('.sheet-table tbody tr').count()) >= 10);
  await noOverflow(page, 'sources');
  await page.close();

  /* import */
  page = await open('/import/');
  await page.click('#sample');
  await page.waitForSelector('#imp-web g.node');
  check(`[${label}] sample import draws a web and a tree`, (await page.locator('#imp-web g.node').count()) >= 5 && (await page.locator('#import-out svg.tree').count()) >= 1);
  check(`[${label}] sample import hides living people by default`, /Living people hidden[\s\S]*1/.test(await page.locator('.report').first().textContent()));
  await page.check('#living');
  await page.waitForSelector('#imp-web g.node');
  check(`[${label}] living people can be included`, (await page.locator('#imp-web g.node').count()) === 7);
  await page.locator('#imp-web g.node').first().click({ force: true });
  await page.waitForSelector('#imp-web .drawer.open');
  check(`[${label}] imported profile opens without a broken full-page link`, (await page.locator('#imp-web [data-full]').isHidden()));
  await page.uncheck('#living');
  await page.setInputFiles('#gedfile', { name: 'mine.ged', mimeType: 'text/plain', buffer: Buffer.from(GED) });
  await page.waitForFunction(() => /mine\.ged/.test(document.querySelector('#import-out')?.textContent ?? ''));
  check(`[${label}] a chosen file is parsed in the browser`, (await page.locator('#imp-web g.node').count()) === 2 && /Test Child/.test(await page.locator('#import-out').textContent()));
  const posts = [];
  page.on('request', (r) => r.method() !== 'GET' && posts.push(r.url()));
  await page.setInputFiles('#gedfile', { name: 'mine2.ged', mimeType: 'text/plain', buffer: Buffer.from(GED) });
  await page.waitForTimeout(400);
  check(`[${label}] importing sends nothing over the network`, posts.length === 0, posts.join());
  await noOverflow(page, 'import');
  await page.setInputFiles('#gedfile', { name: 'tree.zip', mimeType: 'application/zip', buffer: Buffer.from('PK') });
  check(`[${label}] a zip file gets a clear message`, /Zipped files are not supported/.test(await page.locator('#import-out').textContent()));
  await page.close();

  /* theme + 404 */
  page = await open('/people/');
  await page.click('[data-theme-toggle]');
  check(`[${label}] light theme toggles`, (await page.evaluate(() => document.documentElement.getAttribute('data-theme'))) === 'light');
  await page.close();
  page = await ctx.newPage();
  const res = await page.goto(srv.url + '/definitely-missing/');
  check(`[${label}] unknown routes return the 404 page`, res.status() === 404 && /No such page/.test(await page.content()));
  await page.close();

  check(`[${label}] no console errors, page errors or failed requests`, issues.length === 0, issues.slice(0, 5).join(' | '));
  await ctx.close();
}

try {
  await run('desktop 1280', 1280, 800);
  await run('phone 390', 390, 844);
} finally {
  await browser.close();
  await srv.close();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
