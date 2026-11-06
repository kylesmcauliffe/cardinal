#!/usr/bin/env python3
"""Write narration-only text for the eight scripts.

Comments, cue lines, headings, and speaker labels are dropped.
The result is what a voice pass would read.
"""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "narration"
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
SPOKEN = re.compile(
    r"^(Narrator|Quote|Letter|Speech|SPOKEN|SPEECH|DRAMA|NEWS)\s*\([^)]*\):\s*"
)


def narration(text: str) -> str:
    text = re.sub(r"<!--.*?-->", "", text, flags=re.S)
    lines = []
    for line in text.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or stripped.startswith("["):
            continue
        match = SPOKEN.match(stripped)
        if not match:
            continue
        body = stripped[match.end():]
        body = re.sub(r"\[[^\]]*\]", " ", body)
        body = re.sub(r"\s+", " ", body).strip()
        if body:
            lines.append(body)
    return "\n\n".join(lines) + "\n"


def main() -> None:
    OUT.mkdir(exist_ok=True)
    for name in SCRIPTS:
        spoken = narration((ROOT / name).read_text(encoding="utf-8"))
        (OUT / name.replace(".md", ".txt")).write_text(spoken, encoding="utf-8")
        print(f"{name.replace('.md', '.txt')} {len(spoken.split())} words")


if __name__ == "__main__":
    main()
