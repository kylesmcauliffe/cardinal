# Research notes

Short, and dated 10 November 2026. Package licences were read from the npm registry. GEDCOM and Ancestry facts come from the sources linked. Portrait licences were read from the Wikimedia Commons API at fetch time.

## 1. Force-directed graph libraries

| Library | Licence | Renders | Fit |
|---|---|---|---|
| **d3-force** (+ d3-zoom, d3-drag, d3-selection) | ISC | You choose (SVG here) | **Chosen.** Small, no framework, full control of node look (photo bubbles), keyboard and a11y on SVG nodes. About 70 nodes is far below where SVG hurts. |
| Cytoscape.js | MIT | Canvas | Strong graph analysis and layouts. Heavier, and photo bubbles need custom styling. Good if the web grows into analysis. |
| vis-network | Apache-2.0 or MIT | Canvas | Quick to start, physics built in. Less control over a11y and design-system look. |
| sigma.js + graphology | MIT | WebGL | Right choice above a few thousand nodes (a real Ancestry tree). Overkill now. Revisit for imports. |
| force-graph / 3d-force-graph | MIT | Canvas / WebGL | Pleasant out of the box. 3D is not wanted here. |
| ngraph.forcelayout | BSD-3-Clause | None (layout only) | Fast layout engine behind several viewers. |

Decision: d3-force on SVG. Gentle motion is a small custom drift force on top of a low `alphaTarget`. Under `prefers-reduced-motion` the simulation settles and stops.

Family-tree specific libraries exist (family-chart ISC, d3-dag MIT, dTree MIT, Topola Apache-2.0). The MVP lays out its small trees itself, in generations, so there is no dependency. If imported trees get large, family-chart or d3-dag are the candidates.

## 2. GEDCOM

- **What it is.** A line-based text format: `level [@xref@] TAG [value]`, nested by level. Long values continue with `CONT` and `CONC`. Records are `HEAD`, `INDI`, `FAM`, `SOUR`, `NOTE`, `TRLR`. People carry `NAME` (`Given /Surname/`), `SEX`, events such as `BIRT` and `DEAT` with `DATE` and `PLAC`, and links `FAMS` (own family) and `FAMC` (parents' family). Families carry `HUSB`, `WIFE`, `CHIL`, `MARR`. Dates can be exact (`12 MAR 1884`) or qualified (`ABT 1850`, `BEF`, `AFT`, `BET 1850 AND 1860`).
- **Versions.** 5.5.1 was released as a draft in November 1999 and re-released as a standard in October 2019. FamilySearch GEDCOM 7.0 was released 19 May 2021; it is UTF-8 only (5.5.1 also allowed ANSEL, ASCII and UTF-16), uses `.ged`, and defines a zip package, GEDZIP (`.gdz`), for media. 5.5.1 and 7.0 files are in general not valid in each other's version. Real-world files are mostly 5.5.1. The importer therefore reads both, tolerates a byte-order mark, and keeps unknown tags.
- **Ancestry.** Ancestry documents GEDCOM export and upload for a tree's owner (Tree Settings, Export tree). The export arrives inside a zip, holds no photos, and person ids change between exports. Ancestry has no public developer API for personal trees; access is limited to partners such as RootsMagic and Family Tree Maker. So the hookup is file-based, which is also the privacy-friendly route.
- **Privacy.** A GEDCOM can contain living people. Parse in the browser, never upload, and hide the living by default.

Sources: [FamilySearch GEDCOM 7 spec](https://gedcom.io/specifications/FamilySearchGEDCOMv7.html), [GEDCOM overview](https://www.familysearch.org/innovate/gedcom-overview), [migrating 5.5.1 to 7.0](https://gedcom.io/migrate/), [Ancestry: uploading and downloading trees](https://help.ancestry.com/hc/en-us/articles/53933352542867-Uploading-and-Downloading-Trees), [Ancestry API discussion](https://genealogy.stackexchange.com/questions/10552/does-ancestry-have-a-developer-api).

## 3. Public-domain and Creative Commons portrait sources

| Source | What it offers | Licence notes |
|---|---|---|
| **Wikimedia Commons** | Largest single source; machine-readable licence, author, date and description through the API (`extmetadata`). Used here. | Each file has its own licence tag. Public domain tags rest on the uploader's reasoning; read the file page. CC BY and CC BY-SA need attribution; BY-SA needs the same licence on adaptations. Attribution is stored in `data/portraits.json` and shown on each profile and on `/sources`. See [reusing content outside Wikimedia](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia). |
| Library of Congress Prints & Photographs | Many Bain, Harris & Ewing and National Photo Company portraits (several are on Commons). | Rights statements vary per item. Pre-1931 US publications are public domain in the US. |
| US National Archives, Smithsonian Open Access | US government works and CC0 images. | CC0 and US-government works are safe; check each item. |
| Wikidata `P18` (image) | Points at the person's main Commons image. | Same Commons licence rules. Useful for future auto-suggestion. |

**Rules used here.** One named file per person. Licence must be one of: Public domain, CC0, CC BY 2.0/3.0/4.0, CC BY-SA 2.0/3.0/4.0. The fetch script stores a scaled copy (360 px wide), the Commons URL, author, date, licence and a SHA-256, and says "scaled, no other edits". Anyone without a verified file gets an initials bubble. No AI-generated or "imagined" faces. Each image was looked at once to confirm it is a single-person portrait; the identification itself rests on the Commons file page.

**Known weak spots.**
- A 1939 John Steinbeck photograph was evaluated and **rejected**: Commons tags it public domain only on a copyright-not-renewed basis, with no credited photographer and a note that it may still be protected outside the US. Steinbeck gets an initials bubble.
- The Commons date for the Lou Henry Hoover photograph reads 1905 while the picture looks later. Date is shown as Commons states it; it is not used as a fact in the timeline.
- Modern CC BY and CC BY-SA photographs (Shockley, Engelbart, Moore, Hewlett, Page, Brin) require visible credit. Credit is on the profile page; the bubble itself carries only a tooltip.
- A portrait can post-date its subject: the Commons file for Leland Stanford Jr. is an oil painting dated 1890 to 1899, after his death in 1884. The profile caption states the medium.

## 4. Decisions

1. Astro 5 static site, to match `site/`.
2. d3-force on SVG.
3. Hand-curated, quote-verified facts plus the event ledger. No scraping of Wikipedia text for biography.
4. GEDCOM through a small own parser, so the import has no runtime dependency and keeps unknown tags.
5. Fonts (Anybody, Literata) are copied from the existing `@fontsource` packages (SIL OFL) into `public/fonts/`.
