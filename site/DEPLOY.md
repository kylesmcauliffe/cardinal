# Deploy Cardinal

The site is a static Astro build. Firebase Hosting serves `site/dist`. The Firebase project id in `.firebaserc` is the placeholder `cardinal-510519`. Replace it when the real project exists.

## Build

From `site/`:

```bash
npm install
npm run build
```

- Command: `npm run build` (`astro build`)
- Output directory: `site/dist`
- The build reads the manuscript at `books/cardinal/` and the extracted corpus at `site/corpus/`. Run it from a checkout that contains both.

## Audio

Each episode player requests:

```
site/public/audio/ep01.mp3
…
site/public/audio/ep08.mp3
```

Those files are not in the repository. A search of every git object, Git LFS (not used), and this agent's store found no episode MP3. Until a file is present at that path, the player shows “Audio coming soon.” Put the rendered files there, rebuild, and the same player uses them. `npm run build` copies `public/` into `dist/`. The Downloads page links to the same paths.

EPUB and PDF files in `site/public/downloads/` are built from the Quarto book and the episode scripts (`npm run downloads`).

## Firebase Hosting

`site/firebase.json` sets `hosting.public` to `dist`. `site/.firebaserc` sets the default project to `cardinal-510519`.

```bash
cd site
npm run build
npx -y firebase-tools@latest deploy --only hosting --project cardinal-510519
```

The CLI has to be logged in to a Google account that can deploy that project. This repository does not contain credentials, and this document does not record a deploy.

Preview locally after a build:

```bash
npm run preview
```

## What the build includes

- The 52 chapter files, introduction, appendices, and project apparatus in `books/cardinal/`.
- Podcast scripts and reviews from pull requests #8, #9, #10, and #11 (`podcast/ep01-02`, `podcast/ep03-04`, `podcast/ep05-06`, `podcast/ep07-08`), copied read-only into `site/corpus/podcast/`.
- The documentary rewrite from `rewrite/documentary-2026-10`, plus question files and the inauguration note that exist only on `rewrite/eps-1-2`, `rewrite/eps-5-6`, and `rewrite/eps-7-8`. Episodes 3 and 4 of that rewrite are also pull request #6.
- `books/cardinal/references.bib` and `books/cardinal/_project/event-ledger.csv`.

`github.com/kylesmcauliffe/cardinal-sources` returned HTTP 404 on 21 October 2026. Pull requests #1–#3 there were not readable. Nothing from that repository is in the site.

Commit SHAs for the extracts are in `site/corpus/PROVENANCE.md`.
