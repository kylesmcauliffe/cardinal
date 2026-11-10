/**
 * Builds the static mockups in ../mockups/.
 *
 * The mockups are frozen comps: they use the real design-system stylesheet and the real
 * cited dataset, but nothing moves except a slow CSS drift on the bubbles and nothing is
 * clickable. They exist so the layout can be judged (desktop and phone) without running the app.
 *
 *   npx tsx scripts/make-mockups.ts
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY } from 'd3-force';
import { data, makeData } from '../src/lib/data';
import { buildGraph, type GNode, type GLink } from '../src/lib/graph';
import { esc, setLinkResolver, avatarHtml, personPill, statusBadge, citeHtml } from '../src/lib/html';
import { headerHtml, footerHtml } from '../src/lib/chrome';
import { profileHtml } from '../src/lib/profile';
import { axisSvg } from '../src/lib/timeline';
import { treeSvg, familyTitle } from '../src/lib/tree';
import { placeChart, decadeChart } from '../src/lib/charts';
import { formatDate } from '../src/lib/dates';
import { parseGedcom, toDataset, SAMPLE_GEDCOM } from '../src/lib/gedcom';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '..', 'mockups');
mkdirSync(out, { recursive: true });

const PAGE: Record<string, string> = {
  '/': 'web.html',
  '/people/': 'profile.html',
  '/family/': 'family.html',
  '/surnames/': 'surname-place.html',
  '/places/': 'surname-place.html#places',
};
setLinkResolver((path) => {
  if (path.startsWith('/portraits/')) return '../public' + path;
  if (PAGE[path]) return PAGE[path];
  return '#';
});

const css = `
.mockflag { background: var(--paper); color: #1c0d10; font-family: var(--font-display); font-weight: 650; font-variation-settings: 'wdth' 92; font-size: 0.78rem; letter-spacing: 0.03em; text-transform: uppercase; padding: 0.35rem var(--pad); text-align: center; }
.m-only { display: none; }
@media (max-width: 720px) { .d-only { display: none; } .m-only { display: block; } }
.mock .stage { height: min(76vh, 46rem); }
.mock .drawer { position: absolute; }
@media (max-width: 720px) {
  .mock .drawer { position: relative; transform: none; visibility: visible; height: auto; max-height: 40rem; border: 2px solid var(--ink); top: auto; width: 100%; margin-top: 1rem; z-index: 1; }
  .mock .drawer-grip { display: block; }
  .mock .webwrap { display: block; }
}
.mock .toolbar .field input { pointer-events: none; }
.annot { font-family: var(--font-display); font-variation-settings: 'wdth' 90; font-size: 0.82rem; color: var(--ink-dim); margin: 0.5rem 0 0; }
`;

function shell(title: string, current: string, body: string, note: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Mockup: ${esc(title)} · Web of People</title>
<meta name="robots" content="noindex">
<link rel="stylesheet" href="../public/fonts/fonts.css">
<link rel="stylesheet" href="../src/styles/app.css">
<style>${css}</style>
</head>
<body class="mock">
<div class="mockflag">Mockup · static comp, not the running app · ${esc(note)}</div>
${headerHtml(current)}
<main id="main">${body}</main>
${footerHtml({ people: data.people.length, events: data.events.length, sources: data.ds.sources.length, web: data.ds.webSources?.length ?? 0 })}
</body>
</html>
`;
}

/* ---------- baked web ---------- */

function bake(mobile: boolean) {
  const g = buildGraph(data, { shared: true, places: true, mobile });
  const nodes: GNode[] = g.nodes;
  const links: GLink[] = g.links;
  nodes.forEach((n, i) => {
    const a = i * 2.399963;
    const r = 30 + 16 * Math.sqrt(i);
    n.x = Math.cos(a) * r;
    n.y = Math.sin(a) * r * (mobile ? 1.5 : 1);
  });
  const sim = forceSimulation<GNode>(nodes)
    .force('link', forceLink<GNode, GLink>(links).id((n) => n.id).distance((l) => l.dist).strength((l) => l.str))
    .force('charge', forceManyBody<GNode>().strength((n) => (n.kind === 'place' ? -110 : -70 - n.r * 3.5)))
    .force('collide', forceCollide<GNode>((n) => (n.kind === 'place' ? n.hw! + 2 : n.r + 8)).strength(0.9))
    .force('x', forceX<GNode>(0).strength(mobile ? 0.4 : 0.09))
    .force('y', forceY<GNode>(0).strength(mobile ? 0.03 : 0.11))
    .stop();
  for (let i = 0; i < 400; i++) sim.tick();
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const n of nodes) {
    const rr = n.kind === 'place' ? n.hw! : n.r + 6;
    x0 = Math.min(x0, n.x! - rr);
    x1 = Math.max(x1, n.x! + rr);
    y0 = Math.min(y0, n.y! - n.r - 4);
    y1 = Math.max(y1, n.y! + n.r + 20);
  }
  const pad = 18;
  const vb = `${(x0 - pad).toFixed(0)} ${(y0 - pad).toFixed(0)} ${(x1 - x0 + 2 * pad).toFixed(0)} ${(y1 - y0 + 2 * pad).toFixed(0)}`;
  const lines = links
    .map((l) => {
      const a = l.source as GNode;
      const b = l.target as GNode;
      return `<line class="link ${l.type}" x1="${a.x!.toFixed(1)}" y1="${a.y!.toFixed(1)}" x2="${b.x!.toFixed(1)}" y2="${b.y!.toFixed(1)}"/>`;
    })
    .join('');
  let k = 0;
  const bodies = nodes
    .map((n, i) => {
      const dx = (Math.sin(i * 1.7) * 7).toFixed(1);
      const dy = (Math.cos(i * 2.3) * 6).toFixed(1);
      const style = `--dx:${dx}px;--dy:${dy}px;--dur:${(6 + (i % 5)).toFixed(0)}s;--del:-${(i % 7).toFixed(0)}s`;
      if (n.kind === 'place') {
        return `<g transform="translate(${n.x!.toFixed(1)},${n.y!.toFixed(1)})"><g class="hub"><rect x="${-n.hw!}" y="-12" width="${n.hw! * 2}" height="24"/><text text-anchor="middle" dy="0.35em">${esc(n.label.toUpperCase())}</text></g></g>`;
      }
      const sel = n.id === 'herbert-hoover';
      const cid = `mc${mobile ? 'm' : 'd'}${k++}`;
      const hide = n.r < (mobile ? 25 : 27) && !sel;
      const ring = n.src
        ? `<circle class="ring" r="${n.r}"/><clipPath id="${cid}"><circle r="${n.r - 1}"/></clipPath><image href="${esc(n.src)}" x="${-n.r}" y="${-n.r}" width="${n.r * 2}" height="${n.r * 2}" preserveAspectRatio="xMidYMin slice" clip-path="url(#${cid})"/><circle class="ring" r="${n.r}" style="fill:none"/>`
        : `<circle class="ring none" r="${n.r}"/><text class="init" style="font-size:${Math.round(n.r * 0.62)}px">${esc(n.init!)}</text>`;
      return `<g transform="translate(${n.x!.toFixed(1)},${n.y!.toFixed(1)})"><g class="node drift${sel ? ' is-sel' : ''}${hide ? ' lab-hide' : ''}" style="${style}">${ring}<text class="lab" y="${n.r + 14}" style="font-size:12px">${esc(n.label)}</text></g></g>`;
    })
    .join('');
  return `<svg class="web ${mobile ? 'm-only' : 'd-only'}" viewBox="${vb}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Baked layout of the web of people (mockup)"><g class="links">${lines}</g>${bodies}</svg>`;
}

const webD = bake(false);
const webM = bake(true);

const TOOLBAR = `<div class="toolbar">
  <label class="field"><span class="sr">Find a person</span><input type="search" placeholder="Find a person" tabindex="-1"></label>
  <label class="tog"><input type="checkbox" tabindex="-1"> Arrange by time</label>
  <label class="tog"><input type="checkbox" checked tabindex="-1"> Shared-event links</label>
  <label class="tog"><input type="checkbox" checked tabindex="-1"> Place hubs</label>
</div>`;

const LEGEND = `<ul class="legend" aria-label="Legend">
  <li><svg viewBox="0 0 36 8"><path d="M0 4H36" style="stroke:var(--ink);stroke-width:3"/></svg> Family</li>
  <li><svg viewBox="0 0 36 8"><path d="M0 4H36" style="stroke-width:2"/></svg> Partners or employer</li>
  <li><svg viewBox="0 0 36 8"><path d="M0 4H36" style="stroke-width:2;stroke-dasharray:7 5"/></svg> Mentor or recruited</li>
  <li><svg viewBox="0 0 36 8"><path d="M0 4H36" style="stroke:var(--ink);stroke-width:2;stroke-dasharray:2 6;stroke-linecap:round"/></svg> Conflict</li>
  <li><svg viewBox="0 0 36 8"><path d="M0 4H36" style="stroke-width:1;stroke-dasharray:1 5;stroke-linecap:round"/></svg> Same recorded event</li>
  <li>Bubble size = number of people connected</li>
</ul>`;

const c = data.ds.meta.counts;
const verified = data.events.filter((e) => e.status === 'VERIFIED').length;

function hero(): string {
  return `<p class="eyebrow">Cardinal · who knew whom</p>
    <h1>A web of the people in the story</h1>
    <p class="lede">${c.people} real figures from the Cardinal notes, drawn as bubbles that drift. Drag one, scroll or pinch to zoom, click or tap for a profile with a timeline and family history. <span class="more">Lines are stated relationships or two people named in the same recorded event. Nothing here is invented: where the notes are silent, the profile says so.</span></p>`;
}

function howTo(): string {
  return `<section><h2>How to read it</h2><div class="charts-grid">
    <div><h3>Bubbles</h3><p>Size shows how many other people a person is connected to in the notes. A photo means a verified public-domain or Creative Commons portrait; a dashed ring with initials means there is none.</p></div>
    <div><h3>Lines</h3><p>Heavy lines are family. Dashed lines are mentor or recruitment. Faint dotted lines mean two people appear in the same event. Place hubs group people recorded at the same place.</p></div>
    <div><h3>Status</h3><p>${verified} of ${c.events} events are marked Verified in the project’s ledger. The rest are labelled Draft, Needs source or Contested, always as a word.</p></div>
  </div></section>`;
}

const web = shell(
  'Web',
  'web',
  `<div class="page">${hero()}${TOOLBAR}
  <div class="webwrap"><div class="stage">${webD}${webM}
    <div class="zoomctl"><button type="button" class="btn" tabindex="-1">+</button><button type="button" class="btn" tabindex="-1">−</button><button type="button" class="btn" tabindex="-1">Fit</button></div>
    <p class="empty-note">Bubbles are people from the Cardinal notes. A dashed ring means no verified portrait: initials instead.</p>
  </div></div>${LEGEND}${howTo()}</div>`,
  'state: nothing selected',
);

function retargetAxis(html: string, personId: string): string {
  const full = axisSvg(data, [personId], { width: 960 });
  const narrow = axisSvg(data, [personId], { width: 330 });
  return html.replace(/<svg class="tl-axis"[\s\S]*?<\/svg>/, `<span class="d-only">${full}</span><span class="m-only">${narrow}</span>`);
}

const hoover = profileHtml(data, 'herbert-hoover', { heading: 'h2' });
const webOpen = shell(
  'Web with a profile open',
  'web',
  `<div class="page">${hero()}${TOOLBAR}
  <div class="webwrap"><div class="stage">${webD}${webM}
    <div class="zoomctl"><button type="button" class="btn" tabindex="-1">+</button><button type="button" class="btn" tabindex="-1">−</button><button type="button" class="btn" tabindex="-1">Fit</button></div>
  </div>
  <aside class="drawer open" aria-label="Profile"><div class="drawer-grip" aria-hidden="true"></div><div class="drawer-bar"><a class="btn" href="profile.html">Open full page</a><button type="button" class="btn" tabindex="-1">Close</button></div><div class="drawer-body">${retargetAxis(hoover, 'herbert-hoover')}</div></aside>
  </div>${LEGEND}
  <p class="annot">On a phone this panel slides up from the bottom as a sheet over the web; here it is shown stacked so the whole page can be read.</p></div>`,
  'state: Herbert Hoover selected',
);

/* ---------- profile ---------- */

const leland = profileHtml(data, 'leland-stanford', { heading: 'h1' });
const profile = shell(
  'Person profile',
  'people',
  `<div class="page narrow"><p class="meta"><a href="web.html">See in the web</a> · <a href="#">All people</a></p>${retargetAxis(leland, 'leland-stanford')}</div>`,
  'profile with timeline, family history, connections, places and sources',
);

/* ---------- family ---------- */

const comps = data.families();
const stanford = comps.find((cc) => cc.includes('leland-stanford'))!;
const hunt = comps.find((cc) => cc.includes('collis-huntington'))!;
const parsed = parseGedcom(SAMPLE_GEDCOM);
const imp = toDataset(parsed, { filename: 'sample-fictional-family.ged', includeLiving: false });
const impData = makeData(imp.ds);
const impComp = impData.families().sort((a, b) => b.length - a.length)[0];

const family = shell(
  'Family tree',
  'family',
  `<div class="page">
    <p class="meta"><a href="#">All families</a></p>
    <h1>${esc(familyTitle(data, stanford))}</h1>
    <p class="lede">Only relationships stated in the repository are drawn. “—” or “dates not recorded” means no source gives that date.</p>
    <div class="tree-wrap" tabindex="0" role="region" aria-label="Family tree">${treeSvg(data, stanford, 'leland-stanford', 'a')}</div>
    <h2>A sibling pair with an unnamed relative</h2>
    <p>The notes mention a brother of Collis Huntington without naming him. The tree shows a dashed placeholder instead of guessing.</p>
    <div class="tree-wrap" tabindex="0" role="region" aria-label="Family tree">${treeSvg(data, hunt, null, 'b')}</div>
    <h2>What your own family would look like</h2>
    <p>Import a GEDCOM file (for example from Ancestry) and the same view lays out your generations. This one comes from the built-in <b>fictional</b> sample file, not from the Cardinal notes. Living people are hidden by default.</p>
    <div class="tree-wrap" tabindex="0" role="region" aria-label="Family tree from a sample import">${treeSvg(impData, impComp, null, 'c')}</div>
    <p class="annot">Imported facts are labelled “As imported”: shown as written, not verified here.</p>
  </div>`,
  'family tree view, desktop and phone',
);

/* ---------- surname + place ---------- */

const stanfords = data.surnameGroups().find((g) => g.surname === 'Stanford')!;
const stPlace = data.ds.places.find((p) => p.id === 'stanford-ca')!;
const stEvents = data.eventsAt(stPlace.id);
const stPeople = data.peopleAt(stPlace.id);
const placeRows = data.ds.places
  .map((p) => ({ p, n: data.eventsAt(p.id).length, who: data.peopleAt(p.id).length }))
  .sort((a, b) => b.n - a.n)
  .slice(0, 8);

const surnamePlace = shell(
  'Surname and place',
  'surnames',
  `<div class="page">
    <p class="eyebrow">Surname</p>
    <h1>${esc(stanfords.surname)}</h1>
    <h2>People</h2>
    <ul class="people-grid">${stanfords.people
      .map(
        (p) =>
          `<li><a href="#">${avatarHtml(p, 'mini')}<span><b>${esc(p.name)}</b><span class="dim">${esc(p.role ?? 'Role not recorded')}</span></span></a></li>`,
      )
      .join('')}</ul>
    <h2>Origin of the name</h2>
    <p class="not-recorded">Not recorded. The Cardinal notes do not say where the name ${esc(stanfords.surname)} comes from, so none is claimed.</p>
    <div class="gaps"><b>In Dawn:</b> this is where a cited origin note for the surname would attach, next to the family trees that carry the name.</div>
    <h2>Maiden names the notes state</h2>
    <ul class="fam-list">${stanfords.people
      .filter((p) => p.birthSurname)
      .map((p) => `<li><b>${esc(p.name)}</b> <span class="dim">· birth surname ${esc(p.birthSurname)}</span><details><summary>Source</summary>${(p.birthSurnameCites ?? []).map(citeHtml).join('')}</details></li>`)
      .join('')}</ul>

    <h2 id="places" style="margin-top:3rem">Places</h2>
    <table class="sheet-table">
      <thead><tr><th scope="col">Place</th><th scope="col">Events</th><th scope="col">People</th></tr></thead>
      <tbody>${placeRows.map(({ p, n, who }) => `<tr><td><a href="#">${esc(p.name)}</a></td><td>${n}</td><td>${who}</td></tr>`).join('')}</tbody>
    </table>
    <div class="charts-grid">${placeChart(data)}${decadeChart(data)}</div>

    <p class="eyebrow" style="margin-top:3rem">Place</p>
    <h2 style="margin-top:0">${esc(stPlace.name)}</h2>
    <p class="meta">${stPlace.lat?.toFixed(4)}, ${stPlace.lon?.toFixed(4)}. ${esc(stPlace.coordNote ?? '')}</p>
    <h3>People recorded here</h3>
    <ul class="pill-list">${stPeople.map((p) => personPill(p)).join('')}</ul>
    <h3>Events</h3>
    <ol class="tl-list">${stEvents
      .slice(0, 6)
      .map(
        (e) => `<li class="ev"><div class="ev-date">${esc(formatDate(e.date))}</div><div class="ev-main"><div class="ev-title">${esc(e.title)} ${statusBadge(e.status)}</div><p class="ev-with">${e.people.map((id) => esc(data.byId.get(id)?.short ?? data.byId.get(id)?.name ?? id)).join(', ')}</p></div></li>`,
      )
      .join('')}</ol>
  </div>`,
  'surname page, places list and a place page',
);

/* ---------- gallery ---------- */

const pages: { file: string; name: string; what: string }[] = [
  { file: 'web.html', name: 'Web view', what: 'Bubbles with photo or initials, links, place hubs, search and toggles. Nothing selected.' },
  { file: 'web-open.html', name: 'Web with a profile open', what: 'A click opens the profile beside the web (a bottom sheet on a phone).' },
  { file: 'profile.html', name: 'Person profile', what: 'Timeline axis and list with status words, family history, connections, places, sources.' },
  { file: 'family.html', name: 'Family tree view', what: 'Stated families only, a dashed placeholder for an unnamed relative, and a sample import.' },
  { file: 'surname-place.html', name: 'Surname and place', what: 'Surname page with “origin: not recorded”, places table, charts, and a place page.' },
];

const gallery = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Mockups · Web of People</title>
<meta name="robots" content="noindex">
<link rel="stylesheet" href="../public/fonts/fonts.css">
<link rel="stylesheet" href="../src/styles/app.css">
<style>
.gal { display: grid; gap: 2.4rem; }
.gal article { border-top: 2px solid var(--ink); padding-top: 1rem; }
.gal .shots { display: grid; grid-template-columns: minmax(0, 3fr) minmax(0, 1fr); gap: 1.2rem; align-items: start; margin-top: 0.8rem; }
.gal img { border: 1px solid var(--rule); width: 100%; height: auto; max-height: 38rem; object-fit: cover; object-position: top; }
.gal figcaption { font-family: var(--font-display); font-size: 0.78rem; color: var(--ink-dim); margin-top: 0.3rem; }
@media (max-width: 720px) { .gal .shots { grid-template-columns: 1fr; } }
</style>
</head>
<body>
<header class="mast"><div class="mast-in"><a class="brand" href="index.html"><b>Web of People</b>&nbsp;<small>Mockups</small></a></div></header>
<main><div class="page">
<p class="eyebrow">Static comps</p>
<h1>Mockups</h1>
<p class="lede">Five pages, full length from header to footer, each shown at desktop (1280 px) and phone (390 px) width. They are generated from the app’s own stylesheet, renderers and cited data, but frozen: open any page to see it live in your browser at any width. Images are exported by <code>npm run mockups</code>.</p>
<div class="gal">
${pages
  .map(
    (p) => `<article><h2 style="margin-top:0">${esc(p.name)}</h2><p>${esc(p.what)} <a href="${p.file}">Open the page</a></p>
<div class="shots"><figure style="margin:0"><a href="${p.file}"><img src="png/${p.file.replace('.html', '')}-desktop.png" alt="${esc(p.name)} at desktop width" loading="lazy"></a><figcaption>Desktop, 1280 px</figcaption></figure>
<figure style="margin:0"><a href="${p.file}"><img src="png/${p.file.replace('.html', '')}-mobile.png" alt="${esc(p.name)} at phone width" loading="lazy"></a><figcaption>Phone, 390 px</figcaption></figure></div></article>`,
  )
  .join('\n')}
</div></div></main>
</body>
</html>
`;

const files: Record<string, string> = {
  'web.html': web,
  'web-open.html': webOpen,
  'profile.html': profile,
  'family.html': family,
  'surname-place.html': surnamePlace,
  'index.html': gallery,
};
for (const [name, html] of Object.entries(files)) writeFileSync(join(out, name), html);
console.log('wrote', Object.keys(files).join(', '));
