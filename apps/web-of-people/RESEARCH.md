# Research notes

Short, and dated 10 November 2026. Package licences were read from the npm registry. GEDCOM and Ancestry facts come from the sources linked. Portrait licences were read from the Wikimedia Commons API at fetch time. Sections 5 to 7 were added in the second pass (10 November 2026).

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
- **Ancestry.** Ancestry documents GEDCOM export and upload for a tree's owner (Tree Settings, Export tree). The export arrives inside a zip, holds no photos, and person ids change between exports. Ancestry has no public developer API for personal trees. The 2016 community Q&A linked below says access is limited to partners such as RootsMagic and Family Tree Maker; treat that as a community answer, not an Ancestry statement. So the hookup is file-based, which is also the privacy-friendly route.
- **Privacy.** A GEDCOM can contain living people. Parse in the browser, never upload, and hide the living by default.

Sources: [FamilySearch GEDCOM 7 spec](https://gedcom.io/specifications/FamilySearchGEDCOMv7.html), [GEDCOM overview](https://www.familysearch.org/innovate/gedcom-overview), [migrating 5.5.1 to 7.0](https://gedcom.io/migrate/), [Ancestry: uploading and downloading trees](https://help.ancestry.com/hc/en-us/articles/53933352542867-Uploading-and-Downloading-Trees), [Ancestry API discussion](https://genealogy.stackexchange.com/questions/10552/does-ancestry-have-a-developer-api).

## 3. Public-domain and Creative Commons portrait sources

| Source | What it offers | Licence notes |
|---|---|---|
| **Wikimedia Commons** | Largest single source; machine-readable licence, author, date and description through the API (`extmetadata`). Used here. | Each file has its own licence tag. Public domain tags rest on the uploader's reasoning; read the file page. CC BY and CC BY-SA need attribution; BY-SA needs the same licence on adaptations. Attribution is stored in `data/portraits.json` and shown on each profile and on `/sources`. See [reusing content outside Wikimedia](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia). |
| Library of Congress Prints & Photographs | Many Bain, Harris & Ewing and National Photo Company portraits (several are on Commons). | Rights statements vary per item. Pre-1931 US publications are public domain in the US. |
| US National Archives, Smithsonian Open Access | US government works and CC0 images. | CC0 and US-government works are safe; check each item. |
| Wikidata `P18` (image) | Points at the person's main Commons image. | Same Commons licence rules. Useful for future auto-suggestion. |

**Rules used here.** One named file per person. Licence must be one of: Public domain, CC0, CC BY 2.0/3.0/4.0, CC BY-SA 2.0/3.0/4.0. The fetch script stores the Commons thumbnail (Commons serves 500 px wide, or the original when that is smaller), the file page URL, original file URL, author, date, medium, why we are sure it shows this person, licence, check date and a SHA-256. The credit line states the real before and after pixel size, read from the file itself (an earlier version said "360 px", which was not true; a test now compares the stated size with the file). Anyone without a verified file gets an initials bubble, and the profile says what was searched and why nothing was found (`data/portrait-gaps.json`). No AI-generated or "imagined" faces. Each image was looked at once to confirm it is a single-person portrait; the identification itself rests on the file page.

**Known weak spots.**
- A 1939 John Steinbeck photograph was evaluated and **rejected** (twice): Commons tags it public domain only on a copyright-not-renewed basis, with no credited photographer and a note that it may still be protected outside the US. Steinbeck now has a 1949 Los Angeles Daily News photograph that UCLA Library releases under CC BY 4.0.
- The Commons date for the Lou Henry Hoover photograph reads 1905 while the picture looks later. Date is shown as Commons states it; it is not used as a fact in the timeline.
- Modern CC BY and CC BY-SA photographs (Shockley, Engelbart, Moore, Hewlett, Page, Brin) require visible credit. Credit is on the profile page; the bubble itself carries only a tooltip.
- A portrait can post-date its subject: the Commons file for Leland Stanford Jr. is an oil painting dated 1890 to 1899, after his death in 1884. The profile caption states the medium.

## 4. Decisions

1. Astro 5 static site, to match `site/`.
2. d3-force on SVG.
3. Hand-curated, quote-verified facts plus the event ledger. No scraping of Wikipedia text for biography.
4. GEDCOM through a small own parser, so the import has no runtime dependency and keeps unknown tags.
5. Fonts (Anybody, Literata) are copied from the existing `@fontsource` packages (SIL OFL) into `public/fonts/`.

## 5. Second pass: portraits (10 November 2026)

Result: **49 of the 57 people in the web have a licence-checked portrait** (48 from Wikimedia Commons, 1 from the Internet Archive). 8 do not. The first pass had 31.

- **Found this pass (18):** Marc Andreessen, Herbert Boyer, Jim Clark, E. B. Crocker, Gordon French, Jose Figueroa, Phil Knight, Elon Musk, Robert Noyce, Tom Perkins, Arthur Rock, Marc Tessier-Lavigne, Peter Thiel, Don Valentine, Robert Swanson, Frederick Terman and John Steinbeck (17 from Wikimedia Commons), plus Francisco Palóu (Internet Archive, below). Exact files, creators, licences and the page each was checked on are in `data/portraits.json`; the request list with the evidence that each file shows the named person is `data/portrait-requests.json`.
- **Francisco Palóu** is the one non-Commons image: a halftone plate of an oil portrait, in Bolton's 1926 edition of Palóu's *Historical Memoirs of New California* (scanned by the Internet Archive). The plate's own caption reads "Portrait of Father Palóu. From the painting in the Museo Nacional, Mexico." The Internet Archive page has no licence field, so the rights basis is the 1926 US publication date plus an 18th-century painting; that is stated on his profile as a date-based determination, not as a page statement. The attribution to Palóu rests on the 1926 caption. It lives in `data/portraits-other.json`.
- **Not found (8):** Ephraim Adams, Bill Duvall, Charley Kline, Eugene Kleiner, Fred Moore, Jean Hoerni, Russell Varian, Sigurd Varian. Each has a record in `data/portrait-gaps.json` of what was searched (Commons search, the English Wikipedia lead image, Wikidata P18, Commons categories, Library of Congress, Smithsonian Open Access, Internet Archive) and why nothing qualified. The searches found only photographs held by museums or press agencies under non-open terms, or none at all. Calisphere, HathiTrust and DPLA refused automated access, so a yearbook plate for Adams may exist there; nobody has looked.
- **158 people named only as relatives** (parents, spouses, children and siblings added in section 7) get initials and no portrait search. They are hidden from the web unless "Show relatives" is on.

## 6. Second pass: research gaps

Method. Six parallel research passes (Stanford, railroad, missions and Gold Rush, Hoover and Terman, electronics and venture capital, modern) took each "Draft note" event and each "gaps in the record" panel and tried to confirm it against a page that can be read by a script. Every external citation is `{url, title, publisher, kind, q}` where `q` is a verbatim passage. `npm run verify:web` fetches every page again, normalises whitespace, quotes, dashes and footnote markers, and checks that every `q` is on the page; the result (HTTP status, retrieval date, a SHA-256 of the page text and of each quote) is committed in `data/web-verification.json`, and offline tests check that file. As of this commit: **783 citations to 170 pages, 0 failures.** Pages by kind: 71 tertiary (mostly Wikipedia), 57 institutional (universities, archives, museums), 23 reference, 11 scholarly, 8 primary.

Layers. `data/curated.json` and the manuscript are untouched. `data/research.json` patches curated events, overrides the status of ledger rows (the ledger CSV is never edited; the original status is kept as `ledgerStatus`), and adds people, places, events, relationships, organisations and affiliations.

**Draft-note events.** 41 curated events. Before: 7 verified, 1 contested, 33 draft. After: **36 verified, 4 contested, 1 draft**. Across the whole dataset (197 events): **184 verified, 12 contested, 1 draft**. The single remaining draft is `huntington-learns-by-wire` (Huntington, in New York, learns of Hopkins's death by wire): no source we could read states it, and the event says so. Two ledger rows changed status: the Central Pacific incorporation moved from NEEDS SOURCE to VERIFIED, and the Stanford Industrial Park opening from NEEDS SOURCE to CONTESTED.

**Claims in the manuscript that the sources do not support as written** (each is recorded on the event as a `revisionNote`, with the sources):

| Event | Manuscript said | Sources say |
|---|---|---|
| `hopkins-dies-yuma` | "Dies in his rail car at Yuma", 28 March 1878 | 29 March 1878 at Yuma, aboard a company train; contested |
| `judah-lucky-streak` | 9 November 1860 | a letter to Dr Daniel Strong dated 14 November 1860 (Ambrose) |
| `stanfords-recruit-jordan` | 1890 | March 1891; offer accepted 22 March 1891 |
| `varian-lease` | 1953 | first lease signed October 1951; Varian moved onto the site in 1953 |
| `klystron` | year not given | 1937 |
| `frederick-terman-returns` | "the 1930s" | 1924 to 1925, after a tuberculosis convalescence |
| `stanford-governor` | 1861 | 4 September 1861 |
| `jane-funds-university` | June 1893 | 1893 to 1898, until the estate left probate |
| `portola-names-tree` | the Portolá expedition named the redwood El Palo Alto, November 1769 | no 1769 diary reachable here mentions a tree at the San Francisquito Creek camp; the event now reads as the camp itself |
| `musk-stanford` | "Enrolls in Stanford and leaves after two days" | Stanford confirms he applied and was accepted in 1995, with no record that he enrolled; contested |
| `swanson-genentech` | Swanson "fired from Kleiner" | the firm chose to work as two partners and his position ended; softened |
| `page-excite` | January 1997, "$300,000 to Stanford for the license" | 1997; the $300,000 is one part of a $1.6 million proposal that never closed |
| `stanfords-vow` | "The children of California shall be our children", 1884, placed when they decided to build | Stanford's own history says he spoke it on waking the morning his son died; contested |
| `jordan-honolulu` | Jordan "backs natural causes" | he hired a physician to dispute the strychnine finding of the coroner's jury; contested |
| `stanford-swung-and-missed` | missed "the golden spike" | both Stanford and Durant missed an ordinary iron spike wired to the telegraph |
| `hoover-australia` | 1897 to 1908 | about 1897 to 1898, before the China post |
| ledger row 1957-09-18 | Arthur Rock among the eight who resigned | Rock was the banker who helped them find Fairchild; the eight were Blank, Grinich, Hoerni, Kleiner, Last, Moore, Noyce and Roberts |
| ledger row 1919-06-01 | Hoover funds what becomes the Hoover War Collection, 1 June 1919 | the funding telegram is dated 22 April 1919; the event now carries that date and keeps the ledger date as `ledgerDate` (see "Two ledger dates" below) |


**Two ledger dates, resolved.** Two ledger rows carried dates that sources dispute. The ledger CSV itself is never edited. An override in `data/research.json` can set the displayed date; the ledger's own date is then kept as `ledgerDate` and the event must say why (`dateNote`) and carry at least two external cites (a test enforces both).

1. *Marshall's gold find (`ledger-1848-01-24-gold-discovered-at-sutter-s-mill`). Date kept: 24 January 1848.* Three dates are in play.
   - 24 January: James Bigler's diary, in the Online Archive of California finding aid: "Monday 24th - this day some kind of mettle was discover was found in the tail race that that looks like goald". The same finding aid says Azariah Smith "corroborated Bigler's claim by recording the date of discovery as falling in the week before January 30th."
   - About 19 January: Marshall's own 1857 account (malakoff.com): "on or about the 19th of January--I am not quite certain to the day, but it was between the 18th and the 20th of that month--1848". Marshall kept no diary, and says himself he is unsure.
   - 18 January: the Appletons' Cyclopaedia entry (Wikisource): "On 18 Jan., 1848, while superintending the construction of a mill-race, he found a nugget of gold". It names no source, and 18 January is the earliest edge of Marshall's own uncertain range.
   - Bancroft (History of California, vol. 6, p. 50) tested the dates against a journal: "he kept a journal, in which he entered occurrences on the spot, and it is from this journal I get my date." He puts Marshall's arrival at the fort at "the evening of the 28th", which fits a find in the days around the 24th and not much earlier.
   - Reasoning: the only contemporary written record (Bigler, corroborated by Smith) says 24 January; Marshall's recollection came nine years later and gives a range; Appletons is a later dictionary entry with no source. The ledger date stands. The event is marked verified, with the competing dates in its note. The exact day is still disputed among sources, so the note says so.
2. *Hoover War Collection (`ledger-1919-06-01-hoover-funds-what-becomes-the-hoover-war-collect`). Date moved: 1 June 1919 to 22 April 1919.* The ledger row is about Hoover funding the collection, and no source gives 1 June.
   - 22 April 1919: the funding telegram. The Hoover Institution: "On April 22, 1919, Herbert Hoover sent a telegram from Paris to his wife, Lou Henry Hoover, in Palo Alto, California." Its history pages repeat the date. Its "Ideas and Consequences" page has the receipt a day later: "On April 23, 1919, Lou Henry Hoover received a telegram from her husband", and a clarifying "second telegram on May 15".
   - June 1919: the Hoover Institution timeline: "He began the collection in June 1919".
   - 20 June 1919: Stanford Libraries: "1919 June 20 Hoover War Collection (now the Hoover Institution on War, Revolution and Peace) established".
   - Reasoning: the event is the act of funding, which is the April telegram. The June entries are the start of collecting and the formal establishment, later steps in the same story, not the funding. The event now reads 22 April 1919, with the ledger's 1 June kept as `ledgerDate` and all dates listed in the note. The 20 June establishment date is cited on the event rather than given its own event.

**Still unverified or unresolved** (these are the things to read next):

- `huntington-learns-by-wire` (above).
- The "notably bad" mine air quotation about Hoover at Gwalia (a book, not found online).
- Juan Crespí's own diary for 6 to 11 November 1769 was not reachable, so whether he named the tree is neither confirmed nor ruled out.
- Hulda Hoover's death year (1883 or 1884) and cause disagree between sources, so no death event was added. Palóu's birthplace (Petra or Palma) likewise.
- The month of the Page and Excite pitch.
- Dates for most relatives (see section 7). Where no page gives a date the profile says "dates not recorded".
- 53 of the 184 verified events and 134 of the 234 relationships rest on Wikipedia alone (a tertiary source). They carry a verbatim quote and the citation is labelled "tertiary", but they are not confirmed by a second source.
- Pages the script cannot read (Britannica, Library of Congress pages, bioguide, National Academies, the Met, the National Portrait Gallery, Calisphere and HathiTrust return 403 or a challenge page) were not used; nothing was cited from them unread. When a site refuses the project's user agent, `webtext.mjs` retries once through `curl` with a plain browser header, which is how one Ambrose page (erenow.org) was read.

**Citation corrections.** The standing rule is that an unverifiable or nonexistent citation gets removed and replaced. Checked this pass: every web citation is re-fetched and its quote found (above). The three documentation links in section 2 that returned 403 to a script (the FamilySearch GEDCOM overview, the Ancestry help article and the Stack Exchange question) were opened by hand and exist; the Stack Exchange item is a 2016 community answer and is now described that way. No web citation failed the check, so none was removed. The manuscript's wrong dates and wordings are corrections of facts, listed in the table above, not citation fixes.

## 7. Second pass: family links and organisations

- **Family.** 158 relatives were added through stated, sourced links. The dataset now holds 126 parent links, 53 spouse links and 32 sibling links in total. Trees now run to three generations (for example Stanford, Hoover and Noyce). A relative the source mentions but does not name stays a dashed placeholder ("Not named in the notes"); 25 such placeholders remain. Tests: no duplicate pairs, a parent is 12 to 80 years older than a child where both years are known, no cycles, at most two named parents.
- **Organisations.** The data model supports them cleanly: `organisations` and `affiliations` (person, organisation, role), each affiliation with its own quote. 13 organisations and 47 affiliations: Stanford University, Central Pacific Railroad, Shockley Semiconductor Laboratory, Fairchild Semiconductor, Intel, Varian Associates, Hewlett-Packard, Genentech, Kleiner Perkins, Sequoia Capital, Google, Nike (Blue Ribbon Sports) and SRI International. They show as hub nodes in the web (toggle "Organisation hubs"), on `/organisations/`, and on each profile. An organisation appears only where a page states what it is and who was tied to it. Organisations named in the ledger but not given a sourced description (for example Lockheed, IBM, Microsoft, Southern Pacific, Union Pacific) are not added.
