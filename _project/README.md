# CARDINAL — Project Documents

The governing documents for the manuscript. These are not chapters; they are the
rules the chapters are written against.

## Read in this order

| File | What it is |
|---|---|
| `thesis.md` | The argument. The north star. When a chapter drifts, return here. |
| `outline.md` | The locked architecture: 5 acts, 60 chapters, word budget, core question per chapter. Supersedes every earlier structural scheme. |
| `voice.md` | The prose standard. The three-way conversation test. What Cardinal does and does not sound like. |
| `chapter-template.md` | The Pre-Draft Brief and the five-section chapter structure. Fill the brief before writing a sentence. |
| `research-log.md` | Every specific claim with its source and status. Nothing leaves draft without an entry. |
| `source-inventory.md` | Audit of the twelve inherited drafts: what was mined from each, what was discarded. |
| `cut-material.md` | What was removed from the drafts and why. |
| `inherited-epigraph.md` | The AI-authored poem that opened every prior draft. Not for publication; awaiting an authored replacement. |
| `event-ledger.csv` | 47 dated events. Working chronology; source key still to be rebuilt. |

## The one-line version

Whoever controls the chokepoints writes the rules, and then builds an
institution to make the rules look natural.

Rail controlled movement. Stanford controls succession.

## Before drafting any chapter

1. Read the chapter's entry in `outline.md`.
2. Complete the Pre-Draft Brief in the chapter file.
3. Complete this sentence: "This chapter proves that ______ by showing ______."
   If it will not complete, the chapter is not ready.
4. Write the last sentence before the first.

## Before a chapter leaves draft

Run the quality checks in `chapter-template.md` Part Three — voice, structural,
fact, thesis. Log every specific claim in `research-log.md`.

## Build

```sh
quarto render          # full book, HTML and PDF
quarto render --to html
quarto preview         # live preview while writing
```

Chapter files live in `ch/`, named `{act}-{nn}-{slug}.qmd`.
