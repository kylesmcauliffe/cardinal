---
name: Cardinal
description: A keyed survey sheet for the Cardinal reading room.
colors:
  cardinal: "#8c1515"
  cardinal-deep: "#5c0e14"
  ground: "#14090b"
  ground-2: "#241214"
  ink: "#f6efe9"
  ink-dim: "#e7cdc4"
  rule: "#5c3034"
  paper: "#f4ece4"
  light-ground-2: "#e7d9cc"
  light-ink: "#1c0d10"
  light-ink-dim: "#6a3034"
  light-rule: "#e0c4ba"
  light-paper: "#fffaf5"
typography:
  display:
    fontFamily: "Anybody Variable, Anybody, sans-serif"
    fontSize: "clamp(6.6rem, 14.5vw, 13.05rem)"
    fontWeight: 760
    lineHeight: 0.78
    letterSpacing: "-0.035em"
    fontVariation: "wdth 100"
  headline:
    fontFamily: "Anybody Variable, Anybody, sans-serif"
    fontSize: "clamp(2.6rem, 6vw, 4.6rem)"
    fontWeight: 740
    lineHeight: 0.9
    letterSpacing: "-0.035em"
    fontVariation: "wdth 72"
  title:
    fontFamily: "Anybody Variable, Anybody, sans-serif"
    fontSize: "clamp(2rem, 5vw, 3.6rem)"
    fontWeight: 720
    lineHeight: 0.9
    letterSpacing: "-0.03em"
    fontVariation: "wdth 75"
  body:
    fontFamily: "Literata, Iowan Old Style, Palatino, serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "Anybody Variable, Anybody, sans-serif"
    fontSize: "0.68rem"
    fontWeight: 650
    letterSpacing: "0.02em"
    fontVariation: "wdth 100"
rounded:
  none: "0"
spacing:
  icon: "0.15rem"
  tight: "0.4rem"
  field: "0.7rem"
  row: "0.85rem"
  inset: "1.5rem"
  column: "1.6rem"
  section: "2rem"
  rail: "5.75rem"
components:
  rail:
    backgroundColor: "{colors.cardinal}"
    textColor: "{colors.ink}"
    width: "{spacing.rail}"
  rail-link:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0.72rem 0.2rem"
    width: "100%"
  rail-link-hover:
    backgroundColor: "{colors.cardinal-deep}"
    textColor: "{colors.ink}"
  rail-link-current:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.cardinal}"
  theme-toggle:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0.72rem 0.2rem"
    width: "100%"
  theme-toggle-hover:
    backgroundColor: "{colors.cardinal-deep}"
    textColor: "{colors.ink}"
  mast:
    backgroundColor: "{colors.cardinal}"
    textColor: "{colors.ink}"
    typography: "{typography.display}"
    padding: "1.25rem 1.5rem 1.4rem"
  band:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.title}"
    rounded: "{rounded.none}"
    padding: "0.85rem 0.4rem"
  band-hover:
    backgroundColor: "{colors.cardinal}"
    textColor: "{colors.ink}"
  search-field:
    backgroundColor: "{colors.ground-2}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "0.7rem 0.8rem"
    width: "min(100%, 40rem)"
  catalog-row:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    padding: "0.75rem 0"
  soon:
    backgroundColor: "{colors.ground-2}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "0.85rem 1rem"
    width: "min(100%, 40rem)"
---

# Design System: Cardinal

## Overview

**Creative North Star: "The Keyed Survey Sheet"**

Cardinal is a reading room set as a survey sheet of one corridor. The resting field is warm black, with cream type. A fixed cardinal rail is the structural member. The masthead is the same red used as a title block: the existing book cover, the word Cardinal set to the column width, the book's sentence, and a sheet line naming the codex, the corridor, and the author. A two-pixel cream rule closes the block and draws in once.

The index is large names and few words. Episode bands, the catalog, and the ledger tables are ruled rows. A document is a Literata column. Verification status is a word. A billing line at the foot of a document names the file it was copied from. Dark is the resting theme. Light is an override the reader can switch.

**Key Characteristics:**

- Warm-black ground, cream ink, and cardinal as the only chromatic structure
- Anybody Variable at many widths for the index; Literata for the reading column
- Hairline rules and square search fields, with no shadows
- The current rail item reversed to cream; a hovered episode band filled solid cardinal
- Status spelled in the display face; the cover raster and the favicon kept as the existing marks

## Colors

The palette is one red and a warm neutral range. The red is structural. The neutrals are the page, the type, and the hairlines.

### Primary

- **Cardinal** (`#8c1515`): The rail, the masthead field, text selection, the hovered episode band, the caret in the search field, the audio accent, and the map pin fill. The favicon field is the same red.
- **Deep Cardinal** (`#5c0e14`): The hover fill on an inactive rail item and on the theme control. The current rail item does not take this hover.

### Neutral

- **Warm Black** (`#14090b`): The page field in the resting theme. `color-scheme` is dark.
- **Raised Ground** (`#241214`): The step up from the page, used by the search field, the people filter, and the audio coming-soon plate.
- **Cream** (`#f6efe9`): Resting text, rail and mast type, the reversed rail-item ground, the mast rule, and the dark focus outline.
- **Dim Cream** (`#e7cdc4`): Meta lines, the billing line, catalog keys, the place caption, and input placeholders.
- **Oxblood Rule** (`#5c3034`): The 1px hairline on bands, catalog rows, tables, questions, and the billing line.
- **Paper** (`#f4ece4`): The skip-link ground in the resting theme. Light theme assigns this same value to the page field.

### Light theme

Light theme is `data-theme="light"` on the root, with `color-scheme: light`. It reassigns the neutrals and leaves the red alone.

- **Sand** (`#e7d9cc`): Light raised ground.
- **Near-Black Ink** (`#1c0d10`): Light text, and the map pin stroke in both themes.
- **Muted Cardinal** (`#6a3034`): Light dim ink.
- **Pale Rule** (`#e0c4ba`): Light hairlines.
- **Bright Paper** (`#fffaf5`): Light skip-link ground.

The focus outline switches to cardinal in the light theme. Selection stays cardinal with cream type.

### Named Rules

**The One Rail Rule.** Cardinal is the structural color: the rail, the masthead, selection, and the hovered episode band. Deep cardinal is that rail's hover. No second hue is introduced.

**The Rail Stays Red Rule.** Light theme reassigns ground, raised ground, ink, dim ink, the rule, and paper. Cardinal, deep cardinal, and the cream set on the rail and the mast stay as they are in the dark theme.

## Typography

**Display Font:** Anybody Variable (with Anybody, then sans-serif)
**Body Font:** Literata (with Iowan Old Style, then Palatino, then serif)

**Character:** Anybody is the survey face. Its width axis does the work of a size system: the mast word is full width, index names condense, and the phone rail condenses further. Literata is the book face, loaded at regular, italic, bold, and bold italic. The sentence under the mast word, the document column, and the chapter question are Literata. Index titles are Anybody.

### Hierarchy

- **Display** (weight 760, width 100, `clamp(6.6rem, 14.5vw, 13.05rem)`, line-height 0.78, tracking `-0.035em`): The mast word only. Below 800px it becomes `clamp(2.55rem, 12.4vw, 3.35rem)` and stays width 100.
- **Headline** (weight 740, width 72, `clamp(2.6rem, 6vw, 4.6rem)`, line-height 0.9, tracking `-0.035em`): The page title. An episode heading uses the same face at `clamp(1.65rem, 4.4vw, 4.2rem)` and keeps its year range on one line at 0.42em, width 95, weight 640.
- **Title** (weight 720, width 75, `clamp(2rem, 5vw, 3.6rem)`, line-height 0.9, tracking `-0.03em`): The episode name inside a band.
- **Body** (Literata 400, `1.0625rem`, line-height 1.6): The page. The reading column tightens to line-height 1.65 and a measure of 68ch. A chapter question inside that column is italic at `1.25rem`. Prose headings stay Anybody: `1.7rem` at width 85, weight 680, then `1.3rem` for the smaller heading.
- **Label** (weight 650, width 100, `0.68rem`, tracking `0.02em`): Rail items and the theme control. Below 720px the rail label drops to width 62 and `0.5rem`, with tracking reset. Catalog keys, table headers, and the status word are the same face at width 95: keys and headers at `0.82rem`, status at `0.78rem` with tracking `0.03em`.

The sheet line under the mast sentence is Anybody at width 90, weight 560, `0.95rem`. Group labels are width 90, weight 700, `1.4rem`. Catalog titles are width 80, weight 680, `1.45rem`. The next-document row is width 90, weight 640.

### Named Rules

**The Many Widths Rule.** One display face, Anybody Variable, changes width instead of family. The ladder in the stylesheet runs 100, 95, 90, 85, 80, 75, 72, and 62 on the phone rail. Literata does not carry an index title.

**The Column Rule.** Reading text stays Literata at `1.0625rem` inside 68ch. The rail, the mast, and the index carry the display face.

## Layout

The shell sits to the right of a fixed rail (`5.75rem`) and is at least the viewport tall. The home mast is a two-column grid, `minmax(12rem, 22rem)` for the cover and the rest for the title block, with a `1.5rem` gap, aligned to the bottom. Episode bands are a four-track grid: icon, number, name, years (`2.5rem 4.5rem 1fr auto`), inset by the page padding of `1.5rem`. A document pads `1.6rem 1.5rem 3.5rem`. Ledger and catalog pages, and the places plate, widen to `72rem`. The places plate is `minmax(0, 1.45fr)` beside `minmax(16rem, 0.85fr)`. The map well is `min(70vh, 36rem)` tall and at least `22rem`.

At 800px the mast stacks, the cover is capped at 26vh, the plate becomes one column, the map well is `22rem`, and a band drops to three tracks with the years under the name. At 720px the rail docks to the bottom (at least `4.5rem` tall), the home mark and the flexible spacer hide, the shell's side margin returns to zero, and the shell keeps `5.4rem` of padding under the bar. Document and band insets become `1rem`. Bands listed inside a document drop the home band's extra horizontal inset, because the document padding already supplies it.

### Named Rules

**The Docked Rail Rule.** At rest the rail is fixed to the left edge and the shell clears it. At 720px the rail docks to the bottom and the shell's side margin returns to zero.

## Elevation & Depth

The sheet is flat. No shadow is declared. Depth is the step from the page field to raised ground, the cardinal mast and rail set on that field, and the hairline that separates one row from the next. The rail stacks above the sheet. The skip link stacks above the rail when it is focused.

**The Flat Sheet Rule.** Surfaces stay flat at rest and on hover. A hovered band changes field color. It does not lift, blur, or cast a shadow.

## Shapes

Corners on the search field are square. Bands, tables, and the coming-soon plate do not set a radius. Separation is a 1px hairline in the rule color. The mast closes with a 2px cream rule that draws left to right in 900ms on `cubic-bezier(0.16, 1, 0.3, 1)`, and stays still when reduced motion is requested. The only motion in the stylesheet is that draw.

The favicon is a circle: cardinal field, cream stroke, a small tree. Map pins are circles of radius 8, cardinal fill, near-black ink stroke at weight 2. Those circles belong to the mark and to the map. They are not the radius of a control.

### Named Rules

**The Square Field Rule.** The archive search field sets its radius to 0. New fields follow that declaration. The favicon circle and the map pin are not a license to round the index.

## Components

### Rail

The rail is a full-height cardinal column of icon-and-word links: Home, Episodes, Research, Timeline, People, Places, Sources. Each icon is a drawn stroke (Lucide paths, stroke 1.75, 22px; the home mark is the land-plot icon at 26px). Labels are the label face. The current section reverses to cream ground and cardinal type, and keeps that reverse on hover. An inactive item hovers to deep cardinal. Below 720px the same items share one bottom row, labels condensed to width 62.

### Theme toggle

The theme control is the last rail item, a button, not a current-page reverse. It shows a sun icon and the word of the theme it will switch to. Pressed state is `aria-pressed` and the label. The chrome matches an inactive rail item, including the deep-cardinal hover.

### Masthead

The mast is a cardinal title block. The left plate is the existing cover raster, with a near-black stage behind the image so the plate has a ground before it paints. The word, the Literata sentence, and the sheet line stack on the right. The cream rule under them is the only animation.

### Episode bands

A band is one ruled row: episode icon, tabular number, condensed name, years. The row is a link. Hover and focus fill the row with cardinal and cream type. The last row keeps a bottom hairline. Numbers are tabular lining figures.

### Document column

A document opens with the headline, then optional dim meta, then the 68ch column. Quarto blocks in that column take a top hairline; a chapter question drops the hairline and sets italic Literata. Links in the column inherit the ink color, with a 1px underline offset `0.18em`. The next and previous links sit in a display-face row across the column; hover underlines them. The billing line is dim cream, `0.92rem`, with a top hairline, and it names the file.

### Catalog

Catalog entries are a vertical list of links. A hairline sits on the top of each row. The title is Anybody at width 80; the key under it is dim cream at width 95. Hover underlines the title.

### Fields

The archive search is a column: a Literata label, then a square field on raised ground with a 1px rule, cream type, a dim placeholder, and a cardinal caret. The people filter uses the same ground, rule, and type at a shorter padding (`0.55rem 0.7rem`) and a `24rem` cap.

### Ledger tables

Tables are full width, collapsed, with tabular figures and a bottom hairline on each cell. Headers are the display face at width 95 and `0.82rem`. The status cell is the status word in that face at `0.78rem`. The places legend and the source list use this table.

### Places plate

The plate is the map well beside its legend. The well has a 1px rule and a warm gray stage (`#d8d0c6`) before tiles load. The live map is Leaflet on OpenStreetMap tiles, with scroll-wheel zoom off. Pins are the cardinal circles above. The legend is the ledger table under the label "On the map." Names that are not a single place stay in a list under the plate.

### Coming-soon audio

Until an episode file loads, the player shows a raised-ground plate, max `40rem`, with the sentence that audio is coming and the path it is wired to. When metadata loads, that plate hides and the native audio control shows, width up to `40rem`, accented in cardinal.

## Do's and Don'ts

### Do:

- **Do** keep dark as the resting theme: warm black ground, cream ink, oxblood rules. Offer light only as the root override.
- **Do** keep cardinal on the rail and the mast in both themes, and reverse the current rail item to cream with cardinal type.
- **Do** set index titles in Anybody Variable and the reading column in Literata, with the column at 68ch.
- **Do** separate index rows, table rows, and the billing line with a 1px rule.
- **Do** spell verification status in the status face.
- **Do** use the existing cover raster at `cover.png` in the mast, and the existing favicon.
- **Do** draw icons as one stroke weight (1.75) from the shared set. Leave the mast rule's draw off when reduced motion is requested.

### Don't:

- **Don't** add a second chromatic hue, a gradient, a glass fill, or a drop shadow.
- **Don't** round the search field, the bands, or the tables. The search field's radius is 0.
- **Don't** set an index title in Literata, or the reading column in Anybody.
- **Don't** replace Anybody Variable or Literata with a system display face.
- **Don't** place a label above the mast word or a page title. The sheet line sits under the sentence, as the title block's credit.
- **Don't** encode status by color alone. The word is the status.
- **Don't** treat the document pager's arrow characters as the icon system. Icons are the stroked set on the rail and the bands.
