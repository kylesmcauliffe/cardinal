#!/usr/bin/env python3
"""Assemble Cardinal documentary draft from rewrite/chapters/."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent
CH = ROOT / "chapters"
OUT = ROOT / "Cardinal-documentary-draft-v1.1.md"
BIB = ROOT.parent / "books" / "cardinal" / "references.bib"

ORDER = [
    "ep1-01-the-tree.md", "ep1-02-baptismal-register.md", "ep1-03-paper-state.md",
    "ep1-04-rancho.md", "ep1-05-nine-days.md",
    "ep2-01-done-and-panama.md", "ep2-02-the-store.md", "ep2-03-vigilance.md",
    "ep2-04-the-surveyor.md", "ep2-05-vacant-chairs.md", "ep2-06-the-summit.md",
    "ep2-07-ten-miles.md",
    "ep3-01-mussel-slough.md", "ep3-02-sandlot.md", "ep3-03-yuma.md",
    "ep3-04-exclusion.md", "ep3-05-florence-telegram.md",
    "ep4-01-moana.md", "ep4-02-florence-vow.md", "ep4-03-farm-opening-day.md",
    "ep4-04-widow-probate.md", "ep4-05-ross-affair.md", "ep4-06-poland-moana-mausoleum.md",
    "ep5-01-gwalia.md", "ep5-02-bionomics.md", "ep5-03-earthquake.md",
    "ep5-04-feeding-belgium.md", "ep5-05-commerce.md", "ep5-06-radio-lab.md",
    "ep5-07-harvard-internment.md",
    "ep6-01-the-lease.md", "ep6-02-shockley.md", "ep6-03-the-eight.md",
    "ep6-04-defense-money.md", "ep6-05-east-palo-alto.md", "ep6-06-april-third.md",
    "ep7-01-sand-hill.md", "ep7-02-pong-patents.md", "ep7-03-shoe-cabinet.md",
    "ep7-04-backrub.md", "ep7-05-google-garage.md", "ep7-06-paypal.md",
    "ep8-01-inauguration-facebook.md", "ep8-02-palantir.md", "ep8-03-cambridge-china.md",
    "ep8-04-rosewood-daily.md", "ep8-05-musk-doge.md", "ep8-06-compute-thesis.md",
    "coda-street-names.md",
]

def strip_html_comments(text: str) -> str:
    return re.sub(r"<!--.*?-->", "", text, flags=re.DOTALL)

def heading_title(line: str) -> str:
    return line.lstrip("#").strip()

parts = []
parts.append("---\n")
parts.append("title: \"Cardinal\"\n")
parts.append("author: \"Kyle McAuliffe\"\n")
parts.append("date: \"Draft 1.1 · October 2026\"\n")
parts.append("documentclass: book\n")
parts.append("fontsize: 11pt\n")
parts.append("geometry: margin=1in\n")
parts.append("linestretch: 1.15\n")
parts.append("---\n\n")
parts.append("## Contents\n\n")

NOTES = ROOT / "endnotes"
toc_entries = []
body = []
prev_ep = None

def episode_key(fname):
    return fname.split("-")[0]

for idx, fname in enumerate(ORDER):
    path = CH / fname
    if not path.exists():
        raise SystemExit(f"Missing chapter: {fname}")
    text = strip_html_comments(path.read_text(encoding="utf-8")).strip("\n")
    lines = text.splitlines()
    h1 = next((heading_title(l) for l in lines if l.startswith("# ")), None)
    h2 = next((heading_title(l) for l in lines if l.startswith("## ")), None)
    ep = episode_key(fname)
    if fname.startswith("coda"):
        toc_entries.append(f"\n**{h1}**\n")
    else:
        if ep != prev_ep and h1:
            toc_entries.append(f"\n**{h1}**\n\n")
        toc_entries.append(f"- {h2 or h1}\n")
    if ep == prev_ep:
        # drop the repeated episode heading on every chapter after the first
        text = re.sub(r"\A# [^\n]*\n+", "", text)
    body.append("\n\n")
    body.append(text)
    body.append("\n\n\\newpage\n\n")
    nxt = ORDER[idx + 1] if idx + 1 < len(ORDER) else None
    if nxt is None or episode_key(nxt) != ep:
        note = NOTES / f"{ep}.md"
        if note.exists():
            body.append(note.read_text(encoding="utf-8"))
            body.append("\n\n\\newpage\n\n")
    prev_ep = ep

parts.extend(toc_entries)
parts.append("\n\\newpage\n\n")
parts.extend(body)

OUT.write_text("".join(parts), encoding="utf-8")
word_count = len(re.findall(r"\w+", "".join(body)))
print(f"Wrote {OUT} (~{word_count} words incl. notes)")
