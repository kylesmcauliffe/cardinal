# Cardinal: Documentary Rewrite Style Guide

## The feel
- Write it like *O.J.: Made in America*: an eight-episode HBO or Netflix documentary on the page.
- One complete story, told as established fact. The reader watches time pass, learns, and realizes things for themselves.

## Narrator
- The narrator knows everything and already knows how it ends, like a detective or a time traveler: calm, certain, sometimes dry.
- The narrator may foreshadow ("He would not live to see it finished"), but never lectures.
- Never stage a debate between historians. No "some scholars argue / others contend."
- **Contested facts get one confident sentence, then move on.** For example: "The coroner's jury named strychnine; the university's president named her heart; the chemists had found the poison." Cite it.

## Structure
- **Strict chronology.** Time only moves forward within and across episodes.
- The only exception is an episode cold open, which may jump ahead to a moment the episode then reaches.
- Each episode has three parts:
  - a **cold open**: a single vivid scene, about 300–800 words;
  - a **through-line**;
  - an **end turn or cliffhanger** that pulls into the next episode.
- **Scenes follow people.** Every chapter has a POV person, a place and a date. Open on a concrete image from the outline.
- Use the outline's chapter list for each episode: one chapter per scene, or merge two thin scenes.

## Meaning
- **Show it; don't state it.** Ban the words "mechanism," "chokepoint," "the lesson," "what this proves" and "the pattern" until the end of Ep 8.
- The thesis ("Rail controlled movement. Stanford controls succession.") appears **once**, near the end of Ep 8.
- Let recurring people, places and ironies carry the argument. The DEEP CUTs in timeline.md are planted payoffs: set them up early and pay them off later without pointing at them.

## Kyle's lines
- Reuse Kyle's best sentences from `books/cardinal/ch/*.qmd` and `introduction.qmd` where they fit, verbatim or lightly trimmed. Examples:
  - "It was never a secret. It was only subliminal."
  - "The street signs are twelve feet up and lit at night."
  - The street-sign device.
- Mark each reused line with an HTML comment like `<!-- kyle: ch/5-12 -->`.

## Facts and quotes
- **Invent nothing.** Every factual claim must trace to `rewrite/notes/*`, `rewrite/moments.md`, `rewrite/timeline.md`, or the existing chapters and `references.bib`.
- Quotations must be exact and come only from those files. No invented dialogue or reconstructed thoughts. You may paraphrase what a source says someone said, attributed to the source.
- If a scene needs a fact we don't have, write `[TK: what's needed]` and keep going.
- Sensory detail must be sourced or generic-safe. "Snow" in the Sierra in winter is fine; a named weather report is not.

## Citations
- Use Chicago author-date in text, e.g. (White 2022, 173) or (Harris 2023, ch. 1.3).
- Use the existing references.bib keys where possible, as `[@white-railroaded]`.
- New books (Rayner, Ambrose, Baker, Whyte, Miller, Denton, Levy, Siddiqui, Chafkin, Mallaby, McCartney, Winkler, Soni, Vance, Levine, Fisher, Wu) are cited as (Author Year, ch./p.) plus a `<!-- bib: TODO -->` comment.

## Defaults (assumptions until Kyle says otherwise)
- The reader is a general nonfiction reader.
- Jane Stanford's death is told as strychnine poisoning, with the murder question settled in one sentence.
- Bohemian Grove appears only as a sourced detail. Remote viewing is cut.
- Dawn is at most a one-page nod.
- The story ends in 2025.

## Mechanics
- Length: about 15,000 words per episode, which is about 3,000 per chapter.
- File names: `rewrite/chapters/ep{N}-{nn}-{slug}.md`, starting with `# Episode N: Title` / `## Chapter title`.
- American spelling. DM-style plain markdown, with no HTML beyond comments.
- Don't touch `books/` or `main`.

## Workflow (every episode)
1. **Start from what exists.** Pull the relevant `books/cardinal/ch/*.qmd` chapters (paths are in outline.md), the older draft branch, Dawn where relevant, `rewrite/research/`, and `rewrite/notes/`.
2. **Fact-check it** against the notes, moments, timeline, references.bib and research-log. Drop or [TK] anything you can't trace.
3. **Dig deeper. Ask questions:**
   - Why did this happen?
   - Who else was in the room?
   - What did it cost, and who paid?
   - What happened next to these people?

   Answer them from the notes and existing chapters.
4. **Keep `rewrite/QUESTIONS-epN.md`** for each episode, with three sections:
   - the questions asked;
   - the answers found, with sources;
   - the questions still open, as [TK] candidates.
5. **Write** the chapters into `rewrite/chapters/`.

Ebook full text is NOT in the repo. Only short quotes are, in `rewrite/notes/`. If you need a quote that isn't there, mark `[TK: quote from <book>, <locator>]`.
