#!/usr/bin/env python3
"""Report verbatim paragraph repeats in Cardinal rewrite chapters.

Strips HTML comments the same way build-manuscript.py does, then splits each
chapter in ORDER into paragraphs on blank lines. A paragraph longer than 200
characters that is not a heading is reported when that exact text appears more
than once, with every file and paragraph number.
"""
from pathlib import Path
import re
from collections import defaultdict

ROOT = Path(__file__).resolve().parent
CH = ROOT / "chapters"

# Same chapter order as build-manuscript.py.
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
    "appendix-off-the-land.md",
]

MIN_CHARS = 200


def strip_html_comments(text: str) -> str:
    return re.sub(r"<!--.*?-->", "", text, flags=re.DOTALL)


def paragraphs(text: str) -> list[str]:
    """Split on blank lines. Numbering is 1-based over non-empty blocks."""
    blocks = re.split(r"\n\s*\n", text.strip())
    return [block.strip() for block in blocks if block.strip()]


def is_heading(paragraph: str) -> bool:
    first = paragraph.lstrip()
    return first.startswith("#")


def preview(paragraph: str, n: int = 90) -> str:
    flat = re.sub(r"\s+", " ", paragraph).strip()
    if len(flat) <= n:
        return flat
    return flat[: n - 1] + "…"


def main() -> None:
    # text -> list of (filename, paragraph number)
    seen: dict[str, list[tuple[str, int]]] = defaultdict(list)

    for fname in ORDER:
        path = CH / fname
        if not path.exists():
            raise SystemExit(f"Missing chapter: {fname}")
        text = strip_html_comments(path.read_text(encoding="utf-8"))
        for i, para in enumerate(paragraphs(text), start=1):
            if is_heading(para) or len(para) <= MIN_CHARS:
                continue
            seen[para].append((fname, i))

    repeats = {text: locs for text, locs in seen.items() if len(locs) > 1}
    if not repeats:
        return

    # Stable order: first appearance in ORDER, then paragraph number.
    order_index = {name: i for i, name in enumerate(ORDER)}

    def sort_key(item: tuple[str, list[tuple[str, int]]]) -> tuple:
        text, locs = item
        first = min(locs, key=lambda loc: (order_index[loc[0]], loc[1]))
        return (order_index[first[0]], first[1], text)

    for text, locs in sorted(repeats.items(), key=sort_key):
        words = len(re.findall(r"\w+", text))
        print(f"REPEAT {len(locs)} copies, {len(text)} chars, ~{words} words")
        for fname, num in locs:
            print(f"  {fname} paragraph {num}")
        print(f"  {preview(text)}")
        print()


if __name__ == "__main__":
    main()
