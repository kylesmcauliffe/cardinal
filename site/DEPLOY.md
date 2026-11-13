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

## Password lock

The live site is gated by HTTP Basic Auth on a 2nd-gen Cloud Function (`gate` in `us-central1`). Firebase Hosting rewrites every path to that function, including pages and assets. The Hosting `public` directory is empty so files cannot be served without credentials. Username is `cardinal`. The password is the Secret Manager secret `CARDINAL_SITE_PASSWORD` in project `cardinal-510519`; it is not stored in this repository. If the secret is missing the function fails closed (HTTP 500), not open.

Deploy from `site/`:

```bash
cd site
npm ci
npm run build
rm -rf functions/static && mkdir -p functions/static && cp -a dist/. functions/static/
npx -y firebase-tools@latest deploy --only functions,hosting --project cardinal-510519
```

`firebase.json` already runs the build and copy as a functions predeploy step. The Cloud Run/Functions invoker must stay limited to the Firebase Hosting service agent. Do not grant `allUsers`. Responses keep `X-Robots-Tag: noindex, nofollow`. `public/robots.txt` remains `Disallow: /`.
