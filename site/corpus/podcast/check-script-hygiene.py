#!/usr/bin/env python3
"""Text hygiene for the eight Cardinal podcast scripts.

Run from anywhere:

    python3 site/corpus/podcast/check-script-hygiene.py

Checks spoken lines only (Narrator, Quote, Letter, Speech, SPOKEN, SPEECH).
Cue tags, headings, HTML comments, and the review files are not spoken.
This does not decide whether a historical claim is true.
"""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parent
SCRIPTS = (
    "ep01-the-ledger.md",
    "ep02-the-toll.md",
    "ep03-the-octopus.md",
    "ep04-the-boy-and-the-farm.md",
    "ep05-the-engineers-century.md",
    "ep06-the-park.md",
    "ep07-the-road-script.md",
    "ep08-the-open-era-script.md",
)
SPOKEN = re.compile(r"^(Narrator|Quote|Letter|Speech|SPOKEN|SPEECH)\b")
# Tokens a voice model will misread, or scaffold that should not be narrated.
FORBIDDEN = ("$", "[TK", "TODO", "FIXME", "episodesV", "chokepoint", "chapter 6")


def spoken_lines(text: str):
    for number, line in enumerate(text.splitlines(), start=1):
        if SPOKEN.match(line):
            yield number, line


def main() -> None:
    errors = []
    for name in SCRIPTS:
        path = ROOT / name
        if not path.exists():
            errors.append(f"Missing script: {name}")
            continue
        text = path.read_text(encoding="utf-8")
        for number, line in spoken_lines(text):
            for token in FORBIDDEN:
                if token in line:
                    errors.append(f"{name}:{number}: spoken line contains {token!r}")
            if re.search(r"\[\d+\]|\^\d+|ibid\.", line):
                errors.append(f"{name}:{number}: spoken footnote marker")

    road = (ROOT / "ep07-the-road-script.md").read_text(encoding="utf-8")
    if "Andy Capp's Tavern in Sunnyvale" not in road:
        errors.append("ep07: Pong prototype is not placed at Andy Capp's Tavern in Sunnyvale")
    if "Burlingame" in road:
        errors.append("ep07: Burlingame appears in the road script")
    if re.search(r"just fired|had fired Swanson|the fired kid", road):
        errors.append("ep07: Swanson is still called fired")

    open_era = (ROOT / "ep08-the-open-era-script.md").read_text(encoding="utf-8")
    if "Executive Order" not in open_era and "executive order" not in open_era:
        errors.append("ep08: the advisory section does not carry the executive order")
    if "federalregister.gov" not in open_era:
        errors.append("ep08: Federal Register URL is missing from the source comment")
    for number, line in spoken_lines(open_era):
        if "not settled in the notes" in line or "stays unfinished" in line or "book pass" in line:
            errors.append(f"ep08:{number}: production status is being narrated")

    store = (ROOT / "ep02-the-toll.md").read_text(encoding="utf-8")
    if "That is the store." not in store:
        errors.append("ep02: The Store section lost its early-1850s close")

    if errors:
        print("\n".join(errors))
        raise SystemExit(1)
    print(f"ok: {len(SCRIPTS)} scripts")


if __name__ == "__main__":
    main()
