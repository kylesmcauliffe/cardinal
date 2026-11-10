# Web of People: plan

A self-contained app for Cardinal that shows the book's real historical figures as photo bubbles in a gently moving web. You can drag them and click them. A click opens a profile with a working timeline and a family-history panel. Everything on screen cites a file in this repository. The app is built so it can be lifted out of `apps/web-of-people/` later and reused in Dawn (a life timeline, a family history, surname origins, an Ancestry hookup, webs of historical figures).

Status of this document: written before the build, then updated to match what shipped. Section 9 says what is in the MVP and what is not.

## 1. Principles

1. **The repository is the only source of claims.** A person, event, relationship or role exists in the data only if a repo file supports it. Each fact stores the file path and a verbatim quote. A test re-reads the files and fails if a quote is not there.
2. **Unknown stays unknown.** There is no birth date, parentage, face or surname origin unless a source gives one. The UI prints "not recorded" rather than hiding the gap, and shows a neutral initials bubble when there is no verified portrait.
3. **Status is a word.** Ledger rows keep `VERIFIED`, `NEEDS SOURCE` or `CONTESTED`. Facts that come from rewrite drafting notes (timeline, glossary, chapter text) are labelled `DRAFT` because the repo's own research log has not verified them. Colour never carries status alone.
4. **Portraits only from verified licences.** A fetch script reads the licence and author from the Wikimedia Commons API, refuses anything outside an allowlist, and stores attribution in the data.
5. **Local by default.** Imported family files never leave the browser. Nothing is deployed publicly from this PR.

## 2. Data model

Five core entities plus a citation that joins claims to sources. Field names match `data/dataset.json`.

```
Person ──< Relationship >── Person
  │
  └──< Event >── Place
        │  └── people[]  (participants)
        └─ cites[] ─> Source
Relationship ─ cites[] ─> Source
Person.role  ─ roleCites[] ─> Source
```

### Person

| field | meaning |
|---|---|
| `id` | stable slug, e.g. `leland-stanford`. Namespaced when merged across books (`cardinal:leland-stanford`). |
| `name`, `short`, `given`, `surname` | display and sort names. |
| `birthSurname` + `birthSurnameCites` | only when a source states it (Jane Lathrop Stanford, Lou Henry). |
| `role` + `roleCites` | one cited line ("One of the Associates"). Absent when no source gives one. |
| `portrait` | `null` or `{file, author, license, commonsUrl, ...}`. `null` renders an initials bubble. |

There is deliberately **no `birth` or `death` field**. Life events are ordinary events with `kind: "birth" | "death"`. This keeps one provenance mechanism, lets a birth be `CONTESTED`, and lets an unknown birth simply be absent.

### Event

`{ id, people[], date, dateNote?, kind, title, place?, status, cites[], note? }`

- `people[]` are participants. For a death, `subject` names who died.
- `date` is a partial ISO string: `1884-03-13`, `1899-02`, `1874`, a range `1894/1895`, or `null` with a required `dateNote` ("year not given"). Qualifiers (about, before, after) are carried in `dateNote` in the MVP and become structured later.
- `kind`: `birth`, `death`, `life`, `education`, `work`, `founding`, `law`, `publication`, `conflict`, `other`.
- `status`: `VERIFIED`, `NEEDS SOURCE`, `CONTESTED`, `DRAFT`.
- Ledger rows are turned into events by `scripts/build-data.mjs`, keeping the row's own status and a pointer to its line.

### Relationship

`{ id, type, a, b, label, cites[] }` where `b` may be `null` with a `bLabel` for a relative the source mentions but does not name ("a brother").

Types in the MVP: `spouse`, `parent` (a is parent of b), `sibling`, `mentor`, `partners`, `employer`, `recruited`, `conflict`. Family types (`spouse`, `parent`, `sibling`) drive the family-history view. The others only draw lines in the web.

A **group** (the Big Four) expands into pairwise `partners` relationships that share one citation.

The web also draws **shared-event links**: two people named in the same event. These are computed, not stored, and drawn fainter than a stated relationship.

### Place

`{ id, name, kind, lat?, lon?, coordNote? }`. Coordinates exist only where the repo's `site/src/data/geo.json` already pins the name, and carry its caveat (a position for a name, not a measurement from the manuscript). Compound or vague locations ("Los Angeles ↔ Menlo Park") stay as text on the event and have no place.

### Source and citation

- `Source`: `{ path, title, kind, weight }`. `kind` is `ledger`, `research-log`, `drafting-note` or `manuscript`. `weight` says in one sentence how much the repo itself vouches for it.
- Citation: `{ f: path, q: verbatim quote, line? }`. Ledger-derived events cite the ledger line.

### What the model leaves out on purpose

Organisations (Stanford University, Central Pacific, Fairchild) are not nodes yet. They appear as text inside events. Making them nodes (an `Organisation` entity plus `member-of` relationships with dates) is the first post-MVP step because it is what lets the web say "who sat in the same institution".

## 3. Dates and the timeline

The timeline is a lane of dated ticks on a year axis, with an event list under it. Undated events are listed in a separate "date not recorded" group, never plotted. Ranges draw as bars. Filters are the four status words and a text box. Selecting a tick scrolls to and opens the event and its sources. A person can add a connected person's lane to compare.

## 4. Family history

The family view takes every connected set of `spouse`, `parent` and `sibling` relationships and lays it out in generations (couples side by side, children below, siblings in a row). Each card lists what is *not recorded* for that person (parents, birth, death) computed from the data, so a gap is visible. A person with a mentioned-but-unnamed relative gets a dashed placeholder card.

In the MVP the repo supports six small families: Stanford (Leland, Jane, Leland Jr.), Hoover (Herbert, Lou Henry), Terman (Lewis, Frederick), Crocker (Charles, E. B.), Varian (Russell, Sigurd) and Huntington (Collis and an unnamed brother). They are small because the repo does not give more, and the view says so.

## 5. A user's own family and surname trace (post-MVP, designed now)

**Import.** GEDCOM is the interchange path (see `RESEARCH.md`). The MVP ships a client-side importer on `/import` that parses a `.ged` file in the browser and renders it with the same web and family views. Nothing is uploaded.

**Mapping.**

| GEDCOM | this model |
|---|---|
| `INDI` + `NAME` (`Given /Surname/`) | Person `given`, `surname` |
| `BIRT`/`DEAT`/`MARR`/`BURI`/`EVEN` with `DATE`, `PLAC` | Event (`kind`, `date`, `place`) |
| `FAM` with `HUSB`, `WIFE`, `CHIL` | Relationships `spouse` and `parent` |
| `SOUR` records and `SOUR` pointers | Source and citation |
| `NOTE` | Event `note` (not a claim) |
| `QUAY` 0 to 3 | Candidate for `status` (0 maps to `NEEDS SOURCE`); to decide |
| unknown or `_CUSTOM` tags | kept in `ext{}` so a round trip loses nothing |

**Privacy rules for real families.** Treat anyone without a death event and born less than 100 years ago, or with no dates, as living. Living people are hidden by default and never exported. Data stays in memory or IndexedDB. No analytics, no upload.

**Surname trace.** A `Surname` index groups people (already in the MVP at `/surnames`). Post-MVP it gains: variant spellings, an `origin` note that must cite a source (today every surname shows "origin not recorded in the repo"), places by generation, and a migration timeline built from events.

**Ancestry.** Ancestry documents GEDCOM export and upload for a tree's owner and has no public developer API for personal trees (only partners). The hookup is therefore: the user exports a GEDCOM from Ancestry and drops it on `/import`. Ancestry's export arrives zipped, so zip handling is a small follow-up.

## 6. Reuse in Dawn

- The app reads a **dataset adapter**: one JSON file with the shape above. Dawn supplies its own `dataset.json` built from `books/dawn/`. The renderers, graph, timeline, family view and importer do not change.
- Ids are namespaced per book, and a Person may carry `sameAs: ["cardinal:herbert-hoover"]` to link a figure across the two volumes.
- Theme is CSS custom properties in `src/styles/app.css`. Dawn re-skins by overriding them.
- Historical-figure webs add relationship types (`patron`, `rival`, `successor`) and sources of kind `book` instead of repo files. The `cites` shape is the same.

## 7. Architecture

- **Astro 5, static output**, to match `site/`. Per-person, per-family, per-surname and per-place pages are generated at build.
- **d3-force, d3-zoom, d3-drag, d3-selection** for the web. SVG, not canvas: about 70 nodes is small, and SVG gives focus, labels and screen-reader names for free.
- **String renderers** in `src/lib/` produce the profile, timeline, tree and chart HTML. Astro pages call them at build; the drawer calls the same code in the browser. One implementation, two uses.
- **Data** is generated: `data/curated.json` (hand-written, cited) plus `books/cardinal/_project/event-ledger.csv` become `data/dataset.json`. A snapshot of the ledger is kept in `data/` so the app still builds when split out.
- **No backend, no database, no secrets.**
- **Motion** is gentle by default and off under `prefers-reduced-motion`. The web stays draggable either way.

## 8. Tests

1. Data validation (`vitest`): ids, references, dates, statuses, every quote found verbatim in its repo file, ledger lines match, licence allowlist, portrait hashes, no secrets, no excluded brand names.
2. GEDCOM parse and round trip.
3. Build: `astro build` succeeds and emits every route in `URL_SHEET.md`.
4. Browser smoke (headless Chrome through `playwright-core`) at 1280 and 390 wide: web renders, drag moves a node, click opens a profile, timeline filter works, family and surname and place pages render, no horizontal overflow, no console errors.

## 9. Scope

| In the MVP | Out of the MVP |
|---|---|
| Force-directed bubble web: drag, zoom, hover, click, keyboard, reduced motion | Organisation nodes, member-of relationships |
| Profile with timeline, sources, family panel | Editing data in the browser |
| Family-history view with "not recorded" gaps | Multi-user or accounts |
| Surname and place views | Real map tiles (no tile provider chosen) |
| Own charts: events by decade, most connected, span of recorded events | Search across all text |
| Portraits from verified PD and CC files with attribution in data | Portraits for everyone (initials bubble is the fallback) |
| GEDCOM import (client-side) and GEDCOM export of the Cardinal dataset | Zip upload, GEDCOM 7 `.gdz` media, Ancestry sync |
| Static build, no public deploy | Deployment |

## 10. Open questions for Kyle

1. Should the rewrite's `DRAFT` facts stay visible in the web, or only ledger and research-log facts?
2. Organisations next, or the personal-tree import polish?
3. Is Stanford meant to be a visible hub in the web (it is, through place hubs), or should people stand alone?
4. Which Dawn figures first, and which books are the sources there?
