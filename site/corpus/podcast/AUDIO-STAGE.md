# Audio stage

This is the path from a checked script to a player. It is not a second website. No audio file exists yet. This run does not generate, upload, merge, or deploy.

## 1. Research

A spoken fact needs a page that was opened: a primary text, an institution's own quotation, or the chapter of a book whose matching passage was read. A print photograph of the original is not required once the words are in a reputable full text. An author's name, without that passage, is not a source.

Books the Drive reader cannot open, if a later pass still needs them:

- Stephen E. Ambrose, *Nothing Like It in the World*, EPUB `1-wsAScajYXAdo0Vsc47vilMQC7Fh8s_1` (about 12.6 MB; the connector marks it unreadable and the download cap is 10 MB).
- Gordon H. Chang, *Ghosts of Gold Mountain*, EPUB `1YRz_EsBCa9nNeCEJrUppKAHeuvwtsjse` (about 30 MB).
- Richard Rayner, *The Associates*: a title search of Drive on November 6, 2026, returned no file. If it lives under another name, the parent should send the file id or a chapter extract.

## 2. Correction

Edit the script. Unsupported numbers come out. A conflict between two good sources is spoken as both figures, or the more specific document wins and the other stays in an HTML comment. Production notes stay in comments.

## 3. Final audit

`python3 site/corpus/podcast/check-script-hygiene.py`

`node site/scripts/check-audio-manifest.mjs`

`python3 site/corpus/podcast/export-narration.py`

Read the narration files in `site/corpus/podcast/narration/` for chronology and for a sentence that cites a book this pass did not open. The ledger in `AUDIT-2026-11-06.md` is the record of what was opened.

## 4. Generation

The parent generates the audio after this audit, on the voice tier already authorized. This cloud run does not call a paid voice API.

## 5. Audio QA

Listen against the narration export, not against the markdown. Cue brackets and source comments must not be in the file.

## 6. Storage and the manifest

Put each MP3 in Firebase Storage, or in `site/public/audio/`. Set that episode's `src` in `site/src/data/audio-manifest.json`. Do not write the bytes into Firestore. `node site/scripts/check-audio-manifest.mjs` fails if a local `src` points at a missing file. Until `src` is set, the player says the episode is not recorded and does not request a file.

## 7. Players

The episode page and the downloads page already read the manifest. `site/firebase.json` still sends `X-Robots-Tag: noindex, nofollow`. Confirm those two pages after a real `src` exists. Do not add a second app page for the same player.
