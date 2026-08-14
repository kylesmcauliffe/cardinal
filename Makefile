# CARDINAL — build targets
#
# Quarto's incremental build moves rendered files into the output directory as a
# final step, and that step can fail when the output directory holds artefacts
# from a build with a different chapter list. Every target here clears its own
# output directory first, which makes builds reproducible at the cost of a little
# time. Use `quarto preview` while writing.

.PHONY: all book draft pdf preview lint clean

all: lint book

## Reader-facing HTML build.
book:
	rm -rf _book
	quarto render --to html

## Draft build: adds Pre-Draft Briefs, beat outlines, and working summaries.
draft:
	rm -rf _book-draft
	QUARTO_PROFILE=draft quarto render --to html

## PDF. Requires a LaTeX installation.
pdf:
	quarto render --to pdf

## Live preview while writing. Does not clean.
preview:
	quarto preview

## Manuscript integrity checks: structure, cut list, scaffold, progress.
lint:
	@python3 _project/lint.py

clean:
	rm -rf _book _book-draft _freeze .quarto
