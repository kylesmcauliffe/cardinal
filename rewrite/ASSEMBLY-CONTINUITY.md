# Documentary assembly — continuity notes (v1)

**Branch:** `rewrite/documentary-2026-10`  
**Manuscript:** `rewrite/Cardinal-documentary-draft-v1.md`, `rewrite/Cardinal-documentary-draft-v1.pdf`  
**Build:** `python3 rewrite/build-manuscript.py`

## PR integration
Episodes from draft PRs **#3** (`rewrite/eps-1-2`), **#4** (`rewrite/eps-7-8`), **#5** (`rewrite/eps-5-6`), and **#6** (`rewrite/eps-3-4`) are integrated by importing all `rewrite/chapters/*.md` files onto `rewrite/documentary-2026-10` (Oct 13, 2026). PR branches may remain open for review; the integration branch is the assembly source of truth.

## Continuity pass (high level)
- **Episode seams:** Ep 2 → 3 (Promontory/hidden books → Mussel Slough cold open); Ep 3 → 4 (Mar 1884 telegram → Moana 1905 cold open); Ep 4 → 5 (Hoover rich at end → Gwalia; Ep 5 defers 1891 opening to Ep 4); Ep 6 → 7 (SRI cut / April Third → Sand Hill); Ep 7 → 8 (PayPal → inauguration cold open).
- **Duplicate scenes removed:** Full Florence/Muybridge replay cut from `ep4-01` (kept in `ep4-02`/`ep4-03`); Hoover 1891 flashback shortened in `ep5-01`; Ep 8 inauguration block deduped from `ep8-05` (rotunda in `ep8-01`).
- **Thesis:** “Rail controlled movement. Stanford controls succession.” appears **once**, in `ep8-06-compute-thesis.md` (return to Jan 20, 2025).
- **Fiction excluded:** No Trinity / invented traveller; coda is narrator-only walk.
- **Outline debris:** Removed draft fragment lines from `ep8-06`, `ep8-01`, `coda-street-names.md`.

## Remaining open questions (manuscript-wide)
- **Primary quotes not in repo:** Huntington congressional correspondence (paraphrased); Crespí diary exact wording (Ep 1); Chang Stanford→Huntington pre-strike line (Ep 2); Soto diseño primary (Ep 1).
- **Ep 8 living-history:** Some 2025 events in early drafts were cut when unverifiable; `ep8-05` intentionally minimal pending sourced DOGE detail.
- **Bibliography:** Full keys in `books/cardinal/references.bib`; manuscript appendix truncates at 50k chars.

## [TK] in chapter files
**0** `[TK:` markers in `rewrite/chapters/` after assembly pass.
