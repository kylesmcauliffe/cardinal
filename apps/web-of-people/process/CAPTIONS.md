# Process captions

One slide per milestone, in the order the work happened. Screenshots are real captures (the app ones come from `npm run shoot` against the built site, with motion reduced so they repeat). Mockups were generated from the same stylesheet and data as the app, so they show intended layout, not a separate earlier design.

## 1. A cited dataset and verified faces

![Portrait contact sheet](01-data/portraits-contact-sheet.png)

57 people, 78 events and 31 relationships, each citing a repository file with a verbatim quote that a test re-reads. 31 of the 57 people have a portrait that passed the licence allowlist (public domain, CC0, CC BY, CC BY-SA); everyone else gets an initials bubble rather than a guess. Attribution sits in `data/portraits.json`.

## 2. Mockups before the app

![Web mockup, desktop](02-mockups/web-desktop.png)
![Web mockup, phone](02-mockups/web-mobile.png)
![Profile mockup, desktop](02-mockups/profile-desktop.png)
![Family mockup, desktop](02-mockups/family-desktop.png)

Five static comps (web, web with a profile open, profile, family tree, surname and place) at 1280 and 390 px, header to footer, in the Cardinal palette: warm black, cream, cardinal red, square corners, status as a word. Full set in `mockups/png/`.

## 3. The web, running

![Web, desktop](03-app/01-web-desktop.png)
![Profile open beside the web](03-app/02-web-profile-open-desktop.png)

Force-directed bubbles with gentle drift. Drag, zoom, hover to light up neighbours, click for a profile. Lines are stated relationships (solid, dashed, dotted by type) or two people named in one recorded event; place hubs pull together people recorded at the same place.

![Arranged by time](03-app/03-web-by-time-desktop.png)

“Arrange by time” pulls people left to right by their first recorded year, with a ruler.

## 4. On a phone

![Web, phone](03-app/04-web-mobile.png)
![Profile as a bottom sheet](03-app/05-web-sheet-mobile.png)

Same web, portrait layout; a tap opens the profile as a bottom sheet. Touch dragging is covered by the smoke test; pinch zoom comes from d3-zoom and was checked by hand only.

## 5. Profiles, timelines and sources

![Profile, desktop](03-app/06-profile-desktop.png)
![Profile, phone](03-app/07-profile-mobile.png)

A timeline axis (status shown by mark and by word), a filterable list, zoom and pan, a second person’s lane for comparison, and a source with its verbatim quote under every entry. “Gaps in the record” says what the notes do not give.

## 6. Family history

![Stanford family tree](03-app/08-family-desktop.png)
![Terman family tree, phone](03-app/09-family-mobile.png)

Trees only where the notes state a family link. An unnamed relative is a dashed placeholder, never a guess.

## 7. Surnames, places, charts

![Surname page](03-app/10-surname-desktop.png)
![Place page](03-app/11-place-desktop.png)
![Charts](03-app/12-charts-desktop.png)

Surname origins are “not recorded” because the notes do not say. Charts are drawn by hand in SVG from the same data and say what they do not show.

## 8. Bring your own family (stretch)

![GEDCOM import](03-app/14-import-desktop.png)
![GEDCOM import, phone](03-app/15-import-mobile.png)

A GEDCOM file (for example an Ancestry export) is parsed in the browser and shown as the same web and trees. Living people are hidden by default; nothing is uploaded. The sample is a fictional family.
