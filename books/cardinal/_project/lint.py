#!/usr/bin/env python3
"""Manuscript integrity checks for CARDINAL.

Run from the repository root:

    python3 _project/lint.py

Checks:
  1. Structure — 60 chapters exist, are wired into _quarto.yml, and are numbered
     contiguously within each act.
  2. Cut list — terms removed per _project/cut-material.md have not returned.
  3. Scaffold — every chapter carries its heading, anchor, dateline, and question.
  4. Progress — reports how many chapters have a brief, a summary, and prose.
"""
import os
import re
import sys
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CH_DIR = os.path.join(ROOT, "ch")

# Filenames still use the old 2–5 numbering (Dawn took the original Act I
# files). Reader-facing parts are Cardinal Acts I–IV.
EXPECTED_PER_ACT = {2: 13, 3: 13, 4: 14, 5: 12}

# Phrases removed per _project/cut-material.md. These are exact constructions,
# not topics: "conspiracy" and "ChatGPT" are legitimate subjects of this book,
# so banning the bare words produces false positives. What the cut list actually
# removed were specific framings and specific artefacts.
FORBIDDEN = (
    "cardinal conspiracy",
    "california cartel",
    "cartel-polity",
    "sincerely yours",          # the AI-authored epigraph's signature
    "your transcript",
    "no content whatsoever",
    "below is chapter",
    "here is chapter",
    "if you want, i'll write",
    "ready for part",
    "write chapter content here",
    "to be added",
)

# Words that are permitted but warrant a human glance, because the cut list
# constrains how they may be used rather than whether they appear. Reported as
# advisory counts; they do not fail the build.
REVIEW = ("conspiracy", "cartel", "epstein")

PLACEHOLDER = "*To be written before the first sentence of prose.*"


def manuscript_files():
    """Every .qmd tracked as part of the manuscript."""
    out = []
    for name in sorted(os.listdir(ROOT)):
        if name.endswith(".qmd"):
            out.append(os.path.join(ROOT, name))
    for name in sorted(os.listdir(CH_DIR)):
        if name.endswith(".qmd"):
            out.append(os.path.join(CH_DIR, name))
    return out


def read(path):
    with open(path, encoding="utf-8") as fh:
        return fh.read()


def rel(path):
    return os.path.relpath(path, ROOT)


def check_structure(errors):
    found = defaultdict(list)
    pattern = re.compile(r"^([1-5])-(\d{2})-[a-z0-9-]+\.qmd$")

    for name in sorted(os.listdir(CH_DIR)):
        if not name.endswith(".qmd"):
            continue
        m = pattern.match(name)
        if not m:
            errors.append(f"chapter filename does not match "
                          f"{{act}}-{{nn}}-{{slug}}.qmd: {name}")
            continue
        found[int(m.group(1))].append((int(m.group(2)), name))

    total = 0
    for act, expected in EXPECTED_PER_ACT.items():
        chapters = sorted(found.get(act, []))
        total += len(chapters)
        if len(chapters) != expected:
            errors.append(f"Act {act}: expected {expected} chapters, "
                          f"found {len(chapters)}")
        numbers = [n for n, _ in chapters]
        if numbers != list(range(1, len(numbers) + 1)):
            errors.append(f"Act {act}: chapter numbers are not contiguous "
                          f"from 01: {numbers}")

    if total != 52:
        errors.append(f"expected 52 chapters in total, found {total}")

    # Every chapter file must be referenced by the book config, and every
    # reference must resolve to a file.
    config = read(os.path.join(ROOT, "_quarto.yml"))
    referenced = set(re.findall(r"ch/([\w-]+\.qmd)", config))
    on_disk = {n for chapters in found.values() for _, n in chapters}

    for name in sorted(on_disk - referenced):
        errors.append(f"chapter not listed in _quarto.yml: ch/{name}")
    for name in sorted(referenced - on_disk):
        errors.append(f"_quarto.yml references a missing file: ch/{name}")

    return total


def check_cut_terms(errors):
    """Flag removed phrasings; tally words that need a human read."""
    review = defaultdict(list)

    for path in manuscript_files():
        # Collapse whitespace so a phrase broken across a line still matches,
        # while keeping the original text to report real line numbers.
        raw = read(path)
        lowered = raw.lower()
        flat = " ".join(lowered.split())

        for phrase in FORBIDDEN:
            if phrase in flat:
                idx = lowered.find(phrase.split()[0])
                line = lowered[:max(idx, 0)].count("\n") + 1
                errors.append(f"cut phrase {phrase!r} in {rel(path)}:{line}")

        for word in REVIEW:
            count = flat.count(word)
            if count:
                review[word].append((rel(path), count))

    return review


def report_review(review):
    if not review:
        return
    print("\nadvisory — permitted, but constrained by cut-material.md:")
    for word in REVIEW:
        if word in review:
            where = ", ".join(f"{p} ({n})" for p, n in review[word])
            print(f"  {word}: {where}")


def check_scaffold(errors):
    for path in sorted(os.listdir(CH_DIR)):
        if not path.endswith(".qmd"):
            continue
        full = os.path.join(CH_DIR, path)
        text = read(full)
        act, num = path.split("-")[0], path.split("-")[1]

        if not re.search(r"^# .+", text, re.M):
            errors.append(f"{rel(full)}: no level-one heading")
        anchor = f"{{#sec-{act}-{num}}}"
        if anchor not in text:
            errors.append(f"{rel(full)}: missing anchor {anchor}")
        if ".chapter-meta" not in text:
            errors.append(f"{rel(full)}: missing dateline block")
        if "Pre-Draft Brief" not in text:
            errors.append(f"{rel(full)}: missing Pre-Draft Brief")
        if ".chapter-question" not in text and not re.search(r"^\*.+\?\*$", text, re.M):
            errors.append(f"{rel(full)}: core question not carried in the body")


def report_progress(total):
    briefed = summarised = beaten = drafted = 0
    for name in sorted(os.listdir(CH_DIR)):
        if not name.endswith(".qmd"):
            continue
        text = read(os.path.join(CH_DIR, name))
        if "Pre-Draft Brief" in text and PLACEHOLDER not in text:
            briefed += 1
        if "## Working summary" in text:
            summarised += 1
        if "## Beats" in text:
            beaten += 1
        if "Prose is written in Phase" not in text:
            drafted += 1

    print(f"chapters                {total}")
    print(f"briefs complete         {briefed}/{total}")
    print(f"beat outlines           {beaten}/{total}")
    print(f"working summaries       {summarised}/{total}")
    print(f"narrative drafted       {drafted}/{total}")


def main():
    errors = []
    total = check_structure(errors)
    review = check_cut_terms(errors)
    check_scaffold(errors)

    report_progress(total)
    report_review(review)

    if errors:
        print(f"\n{len(errors)} problem(s):")
        for e in errors:
            print(f"  - {e}")
        return 1
    print("\nall checks pass")
    return 0


if __name__ == "__main__":
    sys.exit(main())
