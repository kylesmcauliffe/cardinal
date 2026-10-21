# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

delegated: Astro static site. The request allowed Astro or Quarto and left the choice open. Astro was chosen because the site is an icon-led index with client search, per-episode audio, and a map, exported to a static directory Firebase Hosting can serve. Quarto remains the manuscript toolchain in `books/`; the site reads those sources at build time and does not replace them.

## Users

Inferred (no question tool was available; the brief did not name an audience): a reader of *Cardinal* — the author checking the archive, and anyone following the eight-episode documentary — who needs to find a chapter, a script, a person, a place, or a source without leaving the research.

## Product Purpose

A public reading room for the Cardinal manuscript, the eight-part documentary rewrite, and the eight podcast scripts. Success means every document already in this repository (and the podcast and rewrite branches) is reachable, searchable, and attributed, and nothing on the site is a claim the repository does not contain.

## Positioning

The site is the manuscript's own index: the 52-chapter draft, the rewrite spine, and the episode scripts share one rail. A general history homepage could not truthfully carry this corpus, these verification statuses, or these branch attributions.

## Operating Context

Read in a browser, dark by default. Audio files are added later at `site/public/audio/ep0N.mp3`. Deploy target is Firebase Hosting, project id placeholder `cardinal-510519`.

## Capabilities and Constraints

- Pages: Episodes (player, script, sources), Research (searchable), Timeline, People, Places with a map, Sources.
- Content is read from `books/cardinal/` and from `site/corpus/`, a read-only extract of podcast PRs #8, #9, #10, #11 and the rewrite branches (including PR #6). Do not invent episodes, people, dates, quotations, or citations.
- `github.com/kylesmcauliffe/cardinal-sources` returned HTTP 404 to the authenticated GitHub API during this build. No records from that repository are included.
- Contested and unverified ledger rows keep the status written in `event-ledger.csv`.
- Map pins are geographic positions for place names that appear in the ledger or the street gazetteer. Positions are not measurements from the manuscript. Vague or compound locations are listed and not pinned.
- Audio that is not in `public/audio/` shows a coming-soon state.

## Brand Commitments

- Name: Cardinal. Series line, as specified in the request: book 1 of The McAuliffe Codex. Place: the Stanford corridor, California. Subtitle already in the book project: "The Stanford Corridor".
- Author credit, from the book project: Kyle McAuliffe.
- Cardinal red. Dark mode is the default.
- Visual reference the request made binding: the report-index manner of artometrics.com (large named entries, few words, big type), recolored and reframed for Cardinal.
- Icon-first navigation, short labels.
- Companion volume *Dawn* is named only as the repository names it. It is not numbered as a second codex book; the request numbered only Cardinal.

## Evidence on Hand

- `books/cardinal/` — 52 chapter files, introduction, appendices, `references.bib`, `_project/` (thesis, outline, research log, event ledger, street skeleton, voice, and the rest).
- `books/cardinal/cover.png` — the existing cover.
- `site/corpus/podcast/` — scripts and review files from `podcast/ep01-02`, `podcast/ep03-04`, `podcast/ep05-06`, `podcast/ep07-08`.
- `site/corpus/rewrite/` — documentary rewrite from `rewrite/documentary-2026-10`, plus question files and the inauguration note that exist only on `rewrite/eps-1-2`, `rewrite/eps-5-6`, and `rewrite/eps-7-8`.
- No episode audio is in the repository yet.

## Product Principles

- The repository is the only source of claims.
- Status words (verified, contested, needs source) stay visible.
- The index is short; the documents are complete.
- Branch provenance stays on every extracted file.
- The reading column stays a document. The frame carries the brand.
