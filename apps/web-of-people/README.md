# Web of People

An interactive web of the real people in the Cardinal story: photo bubbles that drift, can be dragged and clicked, and open into profiles with a working timeline and family history. Self-contained in this folder so it can be split out and reused in Dawn (life timeline, family history, surname origins, Ancestry hookup, historical-figure webs).

- Where it stands (second pass, 10 November 2026): 215 people (57 in the web, 158 relatives behind a toggle), 197 events (184 verified, 12 contested, 1 draft), 49 of 57 portraits found, 13 organisations, 170 external pages with 783 verified quotes. What is still unverified: [`RESEARCH.md`](RESEARCH.md) section 6.
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
| `data/curated.json` | Hand-written layer: roles, relationships, places, curated events. Every item has `cites` with a repo path and a verbatim quote. Not edited by the second pass. |
| `data/research.json` | Second-pass layer on top of curated: event patches, ledger status overrides, and added people, places, events, relationships, organisations and affiliations. Every item cites an external page `{url, title, publisher, kind, q}` with a verbatim quote. |
| `data/web-verification.json` | Result of `npm run verify:web`: for each cited page, HTTP status, retrieval date, text hash, and whether each quote was found. |
| `data/portraits.json`, `data/portraits-other.json`, `data/portrait-gaps.json` | 48 Commons portraits, 1 Internet Archive portrait with its rights reasoning, and the 8 people with no portrait and why. |
| `data/ledger-snapshot.csv`, `data/geo-snapshot.json` | Frozen copies of the Cardinal event ledger and place coordinates, so the app builds when split out. |
| `scripts/build-data.mjs` | Merges the curated layer with the ledger into `data/dataset.json`. `--check` fails if the file is stale. |
| `scripts/fetch-portraits.mjs` | Reads licence and author from the Wikimedia Commons API, refuses anything off the allowlist, writes `data/portraits.json` and the served thumbnails in `public/portraits/` (`ONLY=id1,id2` refetches some). |
| `scripts/verify-web.mjs`, `scripts/webgrep.mjs` | Re-fetch every cited page and check each quote (`npm run verify:web`); `webgrep` looks inside one page while researching. |
| `src/lib/` | Renderers shared by build and browser: `graph.ts` (d3-force web), `timeline.ts`, `profile.ts`, `tree.ts`, `charts.ts`, `gedcom.ts`, `data.ts`. |
| `src/pages/` | Astro routes. |
| `src/styles/app.css` | The whole design system as CSS custom properties (Cardinal palette; Dawn can override). |
| `tests/` | vitest suites and the browser smoke test. |

## Rules the data follows

1. A person, event, relationship, role or organisation exists only if a repository file or an external page supports it. Tests re-read the repo files, and `npm run verify:web` re-reads every external page, and fail if a quote is missing. Quotes are checked against the page, not against a summary.
2. Unknown stays unknown. No invented birth dates, parents or faces. Profiles list the gaps.
3. Status is a word: Verified, Needs source, Contested, Draft note (drafting notes the research log has not verified), or As imported.
4. Portraits only from public-domain or Creative Commons files, with attribution stored in `data/portraits.json` (or `portraits-other.json`). Otherwise an initials bubble, and the profile says what was searched.
5. Imported GEDCOM files are parsed in the browser and never uploaded. Possibly-living people are hidden by default.
