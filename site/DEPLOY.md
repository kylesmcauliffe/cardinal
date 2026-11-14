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

Those files are not in the repository. Drive has one earlier cover-story recording and no per-episode MP3. That recording is not copied into the site. Until a file is present at the episode path, the player says the corrected recording is not published and does not request the missing file. Put the rendered files there, rebuild, and the same player uses them. `npm run build` copies `public/` into `dist/`. The Downloads page links to a file only when it is present.

EPUB and PDF files in `site/public/downloads/` are built from the Quarto book and the episode scripts (`npm run downloads`).

## Firebase Hosting

`site/firebase.json` sets `hosting.public` to `dist`. `site/.firebaserc` sets the default project to `cardinal-510519`. Classic Hosting on `cardinal-510519.web.app` is a fallback; the password-protected live site is served by Firebase App Hosting (see below). Do not add a Hosting rewrite to a Cloud Function named `gate`.

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

## Password lock

The live site is served by Firebase App Hosting backend `cardinal` in project `cardinal-510519`, from `site/lock`. A Next.js `proxy.ts` requires HTTP Basic Auth on every route (pages and assets), then a catch-all route serves the built Astro site as static files. Username is `cardinal`. The password is the Secret Manager secret `CARDINAL_SITE_PASSWORD` in project `cardinal-510519`, injected at runtime only via `site/lock/apphosting.yaml`. It is not stored in this repository. If the secret is missing, every route returns 401 (fail closed).

Merges to `main` roll out automatically when the backend is connected to `Artometrics/cardinal`. To grant the existing secret to the backend after it exists:

```bash
npx -y firebase-tools@latest apphosting:secrets:grantaccess CARDINAL_SITE_PASSWORD --project cardinal-510519 --backend cardinal
```

Local production check from `site/lock` (use a dummy password; never commit or print the real secret):

```bash
cd site/lock
npm install
CARDINAL_SITE_PASSWORD=dummy npm run build
CARDINAL_SITE_PASSWORD=dummy npm start
```

Responses keep `X-Robots-Tag: noindex, nofollow`. `public/robots.txt` remains `Disallow: /`.
