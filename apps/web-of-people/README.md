# Web of People

An interactive web of the real people in the Cardinal story: photo bubbles that drift, can be dragged and clicked, and open into profiles with a working timeline and family history. Self-contained in this folder so it can be split out and reused in Dawn (life timeline, family history, surname origins, Ancestry hookup, historical-figure webs).

- Read the design first: [`PLAN.md`](PLAN.md) (data model, import path, MVP scope) and [`RESEARCH.md`](RESEARCH.md) (graph libraries, GEDCOM, portrait sources and licences).
- Routes: [`URL_SHEET.md`](URL_SHEET.md). Process screenshots: [`process/`](process/CAPTIONS.md). Mockups: [`mockups/index.html`](mockups/index.html).

## Run it

```bash
cd apps/web-of-people
npm install
npm run dev          # http://localhost:4321
npm run build        # regenerates data/dataset.json, then astro build into dist/
npm run preview
```

Nothing here deploys anywhere. Every page carries `noindex`. To host under a sub-path, build with `WOP_BASE=/some/path/ npm run build`.

## Checks

```bash
npm run check        # data:check, vitest, build, browser smoke test
npm test             # data validation, GEDCOM, renderers, build and link checks (vitest)
npm run test:smoke   # Chrome through playwright-core at 1280 and 390 px wide (needs a build)
npm run mockups      # rebuild mockups/ and the PNG exports
npm run shoot        # process screenshots of the built app into process/03-app/
```

The smoke test needs Chrome. It looks for `/usr/local/bin/google-chrome`; set `CHROME_PATH` to use another.

## What is where

| Path | What |
|---|---|
| `data/curated.json` | Hand-written layer: roles, relationships, places, curated events. Every item has `cites` with a repo path and a verbatim quote. |
| `data/ledger-snapshot.csv`, `data/geo-snapshot.json` | Frozen copies of the Cardinal event ledger and place coordinates, so the app builds when split out. |
| `scripts/build-data.mjs` | Merges the curated layer with the ledger into `data/dataset.json`. `--check` fails if the file is stale. |
| `scripts/fetch-portraits.mjs` | Reads licence and author from the Wikimedia Commons API, refuses anything off the allowlist, writes `data/portraits.json` and scaled copies in `public/portraits/`. |
| `src/lib/` | Renderers shared by build and browser: `graph.ts` (d3-force web), `timeline.ts`, `profile.ts`, `tree.ts`, `charts.ts`, `gedcom.ts`, `data.ts`. |
| `src/pages/` | Astro routes. |
| `src/styles/app.css` | The whole design system as CSS custom properties (Cardinal palette; Dawn can override). |
| `tests/` | vitest suites and the browser smoke test. |

## Rules the data follows

1. A person, event, relationship or role exists only if a repository file supports it. A test re-reads the files and fails if a quote is missing.
2. Unknown stays unknown. No invented birth dates, parents or faces. Profiles list the gaps.
3. Status is a word: Verified, Needs source, Contested, Draft note (drafting notes the research log has not verified), or As imported.
4. Portraits only from public-domain or Creative Commons files, with attribution stored in `data/portraits.json`. Otherwise an initials bubble.
5. Imported GEDCOM files are parsed in the browser and never uploaded. Possibly-living people are hidden by default.
