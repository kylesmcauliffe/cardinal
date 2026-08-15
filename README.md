# Cardinal & Dawn

A two-book history project by Kyle McAuliffe, built with
[Quarto](https://quarto.org/docs/books). The two volumes are companions and
share a bibliography, styles, and research apparatus.

- **[`books/dawn/`](books/dawn) — _Dawn: An American Odyssey_** — the deep
  history: three thousand years of empire, collapse, and reinvention in the old
  world, running to the eve of the American conquest of California.
- **[`books/cardinal/`](books/cardinal) — _Cardinal_** — the American story:
  how a single stretch of the San Francisco Peninsula — the Stanford corridor —
  became the controlling position in the modern economy, told as a walk through
  the campus and the streets that record it.

Read *Dawn* first for the origins; read *Cardinal* on its own for the argument.

## Build a book

Each book is a self-contained Quarto project. From the book's directory:

```bash
cd books/cardinal   # or books/dawn
quarto preview      # live local preview
quarto render       # build HTML + PDF into _book/
```

The reader-facing build hides the editorial apparatus. To see the draft profile
with the working briefs and summaries:

```bash
QUARTO_PROFILE=draft quarto render
```

The latest rendered PDFs (`Cardinal.pdf`, `Dawn.pdf`) are committed at the
repository root for download.
