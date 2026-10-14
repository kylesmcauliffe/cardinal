# CHANGELOG: Cardinal draft v1 → v1.1 (cleanup pass)

Branch `rewrite/v1.1-cleanup`, cut from `rewrite/documentary-2026-10` @ eb5f7de. October 13, 2026. Approved scope: dedupe, cut essay and meta passages, move citations to endnotes, fix front matter, cut the duplicate Bush/Terman block, fix the 1951/1953 lease date, soften the Crespí redwood line. The Episode 8 restructure (splitting Compute, rewriting The Oval Office) is **not** done here and is flagged below.

## Word counts

| | v1 | v1.1 |
|---|---|---|
| Built manuscript (`wc -w`) | 118,751 | 99,807 (includes ~2,300 words of endnotes) |
| Chapter prose (`rewrite/chapters/*.md`, `wc -w`) | 116,590 | 97,948 |
| PDF pages | 346 | 266 |

## 1. Duplicated paragraphs removed (exact repeats over 25 words)

Rule: keep the copy in the latest chapter, which is the chronologically correct home for every Episode 1 and 2 pair. Exceptions: inside a single chapter, keep the first copy. For the Episode 8 rotunda / Cambridge Analytica pair, 2016–2021 material stays in *Cambridge Analytica* and 2004–2012 Facebook material stays in *The rotunda*.

| File | Paragraphs removed | Words |
|---|---|---|
| ep1-01-the-tree.md | 25 | 1374 |
| ep1-03-paper-state.md | 11 | 689 |
| ep1-05-nine-days.md | 13 | 836 |
| ep2-02-the-store.md | 24 | 1286 |
| ep2-03-vigilance.md | 9 | 624 |
| ep2-04-the-surveyor.md | 15 | 831 |
| ep3-01-mussel-slough.md | 1 | 41 |
| ep4-03-farm-opening-day.md | 1 | 34 |
| ep4-06-poland-moana-mausoleum.md | 1 | 45 |
| ep5-02-bionomics.md | 1 | 41 |
| ep5-03-earthquake.md | 1 | 41 |
| ep5-05-commerce.md | 2 | 90 |
| ep6-01-the-lease.md | 1 | 43 |
| ep6-03-the-eight.md | 2 | 96 |
| ep7-06-paypal.md | 1 | 26 |
| ep8-01-inauguration-facebook.md | 24 | 1222 |
| ep8-03-cambridge-china.md | 13 | 604 |

Total: 145 paragraphs, 7923 words. Headings left empty by these removals were also dropped:

- ep1-01-the-tree.md: ## North from San Diego
- ep1-01-the-tree.md: ## A system, not a settlement
- ep1-01-the-tree.md: ## 320 Dolores Street
- ep1-01-the-tree.md: ## Who the claim was against
- ep1-01-the-tree.md: ## Who this cost
- ep1-03-paper-state.md: ## Sutter
- ep1-05-nine-days.md: ## The scale of the shock
- ep1-05-nine-days.md: ## The state joins in
- ep2-02-the-store.md: ## The subsidy, and where it went
- ep2-02-the-store.md: ## Four merchants
- ep2-02-the-store.md: ## The subsidy, and where it went
- ep2-04-the-surveyor.md: ## The engineer and the merchants
- ep5-05-commerce.md: ## Roosevelt as interpretation

## 2. Repeated sentences removed (over 6 words, same rule)

- coda-street-names.md: 2 sentences
- ep2-02-the-store.md: 4 sentences
- ep2-03-vigilance.md: 5 sentences
- ep2-04-the-surveyor.md: 20 sentences
- ep2-07-ten-miles.md: 1 sentences
- ep3-01-mussel-slough.md: 3 sentences
- ep3-02-sandlot.md: 6 sentences
- ep3-04-exclusion.md: 1 sentences
- ep4-01-moana.md: 2 sentences
- ep4-06-poland-moana-mausoleum.md: 1 sentences
- ep5-03-earthquake.md: 7 sentences
- ep5-04-feeding-belgium.md: 1 sentences
- ep5-06-radio-lab.md: 2 sentences
- ep6-01-the-lease.md: 9 sentences
- ep6-02-shockley.md: 2 sentences
- ep6-03-the-eight.md: 2 sentences
- ep6-05-east-palo-alto.md: 3 sentences
- ep7-06-paypal.md: 3 sentences
- ep8-01-inauguration-facebook.md: 10 sentences

## 3. Essay and meta sections cut

- ep1-01-the-tree.md: **Legibility as power** (14 words)
- ep1-01-the-tree.md: **What the labour actually was** (13 words)
- ep1-01-the-tree.md: **The archive against the archivist** (9 words)
- ep1-02-baptismal-register.md: **Legibility as power** (195 words)
- ep1-03-paper-state.md: **Who the arrangement failed** (24 words)
- ep1-03-paper-state.md: **What is now in place** (25 words)
- ep1-04-rancho.md: **Assets before markets** (201 words)
- ep1-05-nine-days.md: **Beats** (342 words)
- ep1-05-nine-days.md: **What the chapter proves** (112 words)
- ep2-05-vacant-chairs.md: **Hand-off** (88 words)
- ep2-07-ten-miles.md: **Hand-off to wheat and wrath** (73 words)
- ep3-01-mussel-slough.md: **Edge of the next scene** (79 words)
- ep3-04-exclusion.md: **Edge** (122 words)
- ep3-04-exclusion.md: **The moral centre in plain prose** (87 words)
- ep3-05-florence-telegram.md: **Getting this right** (434 words)
- ep3-05-florence-telegram.md: **Closing the decade** (94 words)
- ep4-05-ross-affair.md: **The ironies without a sermon** (133 words)
- ep4-06-poland-moana-mausoleum.md: **End of the episode** (179 words)
- ep5-02-bionomics.md: **The export, flagged** (42 words)
- ep5-03-earthquake.md: **Forward without naming it** (89 words)
- ep5-04-feeding-belgium.md: **Why an archive matters** (181 words)
- ep5-05-commerce.md: **Solving the wrong problem correctly** (170 words)
- ep5-05-commerce.md: **Solving the wrong problem, again** (115 words)
- ep5-06-radio-lab.md: **Readiness, not destiny** (44 words)
- ep5-06-radio-lab.md: **Handoff** (52 words)
- ep5-06-radio-lab.md: **Crisis selects ecosystems** (60 words)
- ep5-06-radio-lab.md: **The plaque's deflation** (46 words)
- ep5-06-radio-lab.md: **Handoff to Harvard** (54 words)
- ep5-07-harvard-internment.md: **Two Termans, one county** (79 words)
- ep6-01-the-lease.md: **The problem, restated as an opportunity** (99 words)
- ep6-01-the-lease.md: **Cold open, restated** (80 words)
- ep6-02-shockley.md: **The excluded, named as absent** (143 words)
- ep6-02-shockley.md: **Edge of the scene** (116 words)
- ep6-02-shockley.md: **Contingency, restated** (167 words)
- ep6-03-the-eight.md: **The military customer, again** (37 words)
- ep6-04-defense-money.md: **The forgotten employer, restated** (149 words)
- ep6-04-defense-money.md: **Act II's promise kept** (89 words)
- ep6-04-defense-money.md: **Grievance scheduled** (135 words)
- ep6-05-east-palo-alto.md: **What the April Third Movement will not be about** (133 words)
- ep6-05-east-palo-alto.md: **Harris's juxtaposition** (81 words)
- ep6-05-east-palo-alto.md: **What April Third will not fix** (79 words)
- ep6-06-april-third.md: **The coalition's four demands, restated** (75 words)
- ep6-06-april-third.md: **Conscience inside the machine** (52 words)
- ep6-06-april-third.md: **What changed and what did not** (102 words)
- ep7-05-google-garage.md: **The appendix, again** (171 words)

What was kept or converted:
- *Nine Days*: the numbered **Beats** list was a writer's brief, so it was deleted. The prose under it (treaty signed 2 Feb 1848; gold found nine days earlier; news confirmed in December) now opens the chapter. The opening synopsis block ("The chapter's argument is…", plus a stray `{.callout-caution}`) was also cut.
- *Nine Days*: **What the chapter proves** was cut down to its two closing narrative paragraphs ("The fighting in California lasted seven months…"), with no heading.
- *Florence Telegram*: **Getting this right** (434 words of hedging on the Santa Clara headnote) became one confident paragraph. It keeps the facts: the holding decided the fence tax; Davis had been president of the Newburgh and New York Railway; and Fourteenth Amendment use by corporations far exceeded use by Black litigants.
- These sections were deliberately kept despite essay-like headings, because they carry facts the chapters need: Baptismal Register (*What the labour actually was*, *The archive against the archivist*, *Before markets*); Paper State (*Who this cost*); Rancho (*Who the arrangement failed*, *What is now in place*); Nine Days (*What the treaty did*, *The method*, *What fifteen million dollars bought*); Bionomics (*Two Termans*); Mussel Slough (*What Mussel Slough meant*).

## 4. "This chapter…" / "The chapter…" sentences and Episode 8 "the drafts…" asides removed

- ep1-03-paper-state.md: “The chapter's point is that the claim was the asset, and a claim is maintained against possibilities rather than against events.”
- ep1-05-nine-days.md: “The chapter's argument is that this arithmetic is not the point, and that treating it as an extraordinary bargain misunderstands the transaction.”
- ep2-04-the-surveyor.md: “The chapter states this plainly and lets it stand.”
- ep2-05-vacant-chairs.md: “This chapter is about how the route was chosen—not by excellence alone, but by subtraction.”
- ep3-02-sandlot.md: “This chapter fails if the men on the sandlots are caricatured.”
- ep3-05-florence-telegram.md: “This chapter stops at death and wire.”
- ep4-04-widow-probate.md: “This chapter belongs to Jane Stanford, who was not merely a widow in mourning but the executive who kept the doors open.”
- ep4-05-ross-affair.md: “This chapter ends on a night visit.”
- ep4-05-ross-affair.md: “The chapter states it and moves on.”
- ep4-06-poland-moana-mausoleum.md: “The chapter does not rest on naming a murderer.”
- ep4-06-poland-moana-mausoleum.md: “The chapter records it and does not solve it.”
- ep5-01-gwalia.md: “The chapter does not skip what followed, because the strongest case against Hoover's early career is here.”
- ep5-02-bionomics.md: “The chapter owes them presence as people, within what the record preserves, because the argument about heredity was not abstract.”
- ep5-04-feeding-belgium.md: “The chapter names who is absent from the arrangement because the absence is structural.”
- ep5-06-radio-lab.md: “The chapter ends where the next one begins: not in Palo Alto, but on the East Coast, with Terman managing radar countermeasures and with families on the Peninsu”
- ep6-02-shockley.md: “This chapter stops before September, when eight men resign on the same day.”
- ep6-03-the-eight.md: “The chapter keeps the substrate visible, because the early market was not consumer electronics and was not close to it.”
- ep6-04-defense-money.md: “The chapter should give the arrangement its due before turning on it, because the output was extraordinary.”
- ep6-04-defense-money.md: “The chapter's argument is not that public research funding is a mistake.”
- ep6-04-defense-money.md: “The chapter describes it as a procurement rather than as a revelation.”
- ep6-04-defense-money.md: “This chapter names the substrate so the occupation reads as response, not tantrum.”
- ep6-04-defense-money.md: “This chapter chooses the payroll scale because Episode 6's last scene is students occupying a laboratory over classified defence electronics — not over a resist”
- ep6-05-east-palo-alto.md: “This chapter is the map that shows who already owned the commute before the students read the classified budgets.”
- ep6-05-east-palo-alto.md: “This chapter signs the social lease written in covenants and FHA colors: who may buy within reach of the jobs the park creates.”
- ep6-05-east-palo-alto.md: “This chapter tells a story about who could afford to stay near the genius's parking lot.”
- ep6-05-east-palo-alto.md: “This chapter is the geography outside the lease: who the park priced out before the poster went up, and who still rides the bus when the occupation ends and SRI”
- ep6-06-april-third.md: “The chapter is stronger for conceding that the conscience of the machine is still the machine (`books/cardinal/ch/4-07-april-third-movement.”
- ep7-01-sand-hill.md: “The chapter's central claim is that venture capital's function is selection rather than finance, and the term sheet is the evidence.”
- ep7-03-shoe-cabinet.md: “The chapter's hinge: the model requires the migration.”
- ep7-03-shoe-cabinet.md: “This chapter exists because the mechanism this book describes is not a story about computers, and shoes prove it.”
- ep7-03-shoe-cabinet.md: “The chapter records both the criticism and the response, and then makes the structural point that neither addresses.”
- ep7-06-paypal.md: “The chapter should resist admiration: the network's efficiency at reproducing itself is precisely the barrier.”
- ep7-06-paypal.md: “The chapter resists admiration.”
- ep7-06-paypal.md: “The chapter records this without alarm, because alarm is not the register, and because the facts are on public disclosure filings.”
- ep8-01-inauguration-facebook.md: “The chapter begins with the seating and largely declines to interpret it, because the proximity is the evidence and it needs no assistance.”
- ep8-01-inauguration-facebook.md: “The chapter cites amounts from filings and declines to characterise motives, because the motives are not knowable and the filings are.”
- ep8-01-inauguration-facebook.md: “The chapter records the position, its stated remit, and its authority as described in the establishing documents.”
- ep8-01-inauguration-facebook.md: “The chapter closes on a contrast and then stops.”
- ep8-01-inauguration-facebook.md: “The chapter uses these figures because they are documented in agency records, and it notes that several widely repeated user and account numbers from this perio”
- ep8-02-palantir.md: “The chapter states the loop before commenting on it.”
- ep8-02-palantir.md: “The chapter states the loop before commenting on it, because the loop is the point and the arrangement was never secret.”
- ep8-02-palantir.md: “The chapter gives the documents first and the response second, and notes that the policy question — what a government should do — is genuinely separable from th”
- ep8-02-palantir.md: “The chapter records this without alarm.”
- ep8-03-cambridge-china.md: “The chapter opens there because it is the most accurate available description of what the company had become, and because the company spent a decade insisting i”
- ep8-03-cambridge-china.md: “The chapter's argument is that neutrality was a legal posture rather than a description, because the same firm was continuously exercising editorial control thr”
- ep8-03-cambridge-china.md: “The chapter uses the UN Human Rights Council's findings and the company's own commissioned human rights assessment, and gives the episode its full weight rather”
- ep8-03-cambridge-china.md: “The chapter starts with the object and then follows it backwards, because the supply chain that now looks like a strategic vulnerability was built deliberately,”
- ep8-03-cambridge-china.md: “The chapter notes without irony that the industry receiving it is the one that spent the preceding forty years explaining that markets allocate better than gove”
- ep8-03-cambridge-china.md: “The chapter leaves the implication where it is.”
- ep8-04-rosewood-daily.md: “The chapter is exact about the findings, because this is precisely where the reporting was loosest and the distinction matters: the review addressed manipulated”
- ep8-04-rosewood-daily.md: “The chapter cites the review rather than the headlines.”
- ep8-04-rosewood-daily.md: “The chapter also gives the honest structural version, which is more damning than the personal story: the incentives operating in high-prestige laboratories reli”
- ep8-05-musk-doge.md: “The chapter is not about that meeting alone.”
- ep8-05-musk-doge.md: “The chapter records what was established on paper and where authority was contested, without narrating events that could not be verified at draft time.”
- ep8-06-compute-thesis.md: “The chapter states market share figures with a date and a definition or not at all, because accelerator share depends entirely on how the market is drawn — whet”
- ep8-06-compute-thesis.md: “The chapter uses company-reported weekly active user figures where they exist, with dates, and states the definition in the text, because in this industry the d”
- ep8-06-compute-thesis.md: “The chapter does not need to argue this.”
- ep8-06-compute-thesis.md: “The chapter concedes this and still uses the episode, and a reader is entitled to think it is doing more work than the evidence supports.”
- ep8-01-inauguration-facebook.md: “The drafts of this project leaned on this episode heavily and also contained several 2025 events narrated as fact that could not be verified at all.”
- ep8-02-palantir.md: “Revenue figures come from filings rather than from the unsourced number the drafts carried.”
- ep8-02-palantir.md: “The drafts carried an unsourced number; replace it.”
- ep8-02-palantir.md: “The drafts of this project carried a single unsourced revenue number that did not correspond to any reported figure, and it has been removed.”
- ep8-03-cambridge-china.md: “The drafts carried figures without sourcing and several did not survive checking.”
- ep8-03-cambridge-china.md: “The Cambridge Analytica disclosures, congressional testimony, and the FTC settlement that followed are given with every figure independently verified and dated,”
- ep8-06-compute-thesis.md: “The drafts of this project carried a round number with no source, and it has been removed.”

## 5. Writer's-brief leftovers removed

Indented continuation lines of old numbered beat lists, i.e. instructions such as "Do this without comment; the list is the argument." and "Point at ch. 7…".

- coda-street-names.md: 12 lines
- ep7-03-shoe-cabinet.md: 13 lines
- ep7-06-paypal.md: 12 lines
- ep8-02-palantir.md: 10 lines
- ep8-03-cambridge-china.md: 28 lines
- ep8-04-rosewood-daily.md: 13 lines

- ep8-01 *The rotunda*: an old brief (≈55 lines: "The chapter begins with the seating…", contested-history instructions, a cut-material note) sat between the "Palo Alto, California. 2004." dateline and "When does subliminal become explicit?". It was removed.

## 6. Stale cross-references to the old Act/chapter structure

Automatic removals, e.g. ", described in Act II chapter 8." → ".":

- ep1-03-paper-state.md: “the opening episodes chapter 5” → “an earlier chapter”
- ep6-04-defense-money.md: “Act II's ” → “the earlier ”
- ep7-03-shoe-cabinet.md: “ in Act I” → “”
- ep7-03-shoe-cabinet.md: “ in Act II chapter 6” → “”
- ep7-03-shoe-cabinet.md: “ from Act I chapter 9” → “”
- ep7-03-shoe-cabinet.md: “Act IV's ” → “the earlier ”
- ep7-06-paypal.md: “Act I's ” → “the earlier ”
- ep8-01-inauguration-facebook.md: “ described in Act III chapter 13” → “”
- ep8-01-inauguration-facebook.md: “, as Act III chapter 12 described” → “”
- ep8-01-inauguration-facebook.md: “ in Act III chapter 13” → “”
- ep8-02-palantir.md: “ in Act I” → “”
- ep8-02-palantir.md: “ in Act IV chapter 13” → “”
- ep8-02-palantir.md: “Act II's ” → “the earlier ”
- ep8-02-palantir.md: “Act II's ” → “the earlier ”
- ep8-02-palantir.md: “Act III ch. 13's ” → “the earlier ”
- ep8-03-cambridge-china.md: “, from Act III chapter 14,” → “,”
- ep8-03-cambridge-china.md: “, described in Act II chapter 8” → “”
- ep8-03-cambridge-china.md: “ from Act I ch. 11” → “”
- ep8-03-cambridge-china.md: “Act I's ” → “the earlier ”
- ep8-03-cambridge-china.md: “Act I's ” → “the earlier ”
- ep8-03-cambridge-china.md: “Act II's ” → “the earlier ”
- ep8-04-rosewood-daily.md: “ described in Act III chapter 1” → “”
- ep8-04-rosewood-daily.md: “ in Act I chapter 7” → “”
- ep8-04-rosewood-daily.md: “ in Act II chapter 8” → “”
- ep8-06-compute-thesis.md: “ in Act I chapter 9” → “”
- ep8-06-compute-thesis.md: “Act II chapter 11's ” → “the earlier ”

Hand rewrites:

- ep2-06-the-summit.md: “The ledger in the project appendix fixes a date:” → “One reconstruction fixes a date:”
- ep2-06-the-summit.md: “ (appendix-b-ledger.qmd)” → “”
- ep8-01-inauguration-facebook.md: “The drafts of this project leaned on this episode heavily and also contained several 2025 events narrated as f” → “” (already removed in §4)
- coda-street-names.md: “Act I chapter 1 is a drive you can still take.” → “The Portolá road is a drive you can still take.”
- ep1-01-the-tree.md: “ (timeline; repo ch. 2-01)” → “”
- ep1-02-baptismal-register.md: “Everything Act II describes” → “Everything that follows”
- ep1-03-paper-state.md: “that will produce the transfer in chapter 4: the land grant.” → “that will produce the next transfer: the land grant.”
- ep1-05-nine-days.md: “whose private establishment was described in chapter 3, was” → “whose private establishment at New Helvetia had been the valley's only real enterprise, was”
- ep2-02-the-store.md: “that this act will describe again in chapter 11 and the story will describe again in the opening episodesV:” → “that will recur on the sandlots of the 1870s and again in the twenty-first century:”
- ep2-02-the-store.md: “the shovel-sellers of chapter 6 operating” → “Brannan's shovel-selling operating”
- ep2-03-vigilance.md: “Hold it; chapter 8 depends on it.” → “”
- ep2-06-the-summit.md: “, as reconstructed in the secondary literature summarized in repo ch. 2-09,” → “, as historians have reconstructed them,”
- ep7-03-shoe-cabinet.md: “Act IV will show software doing it with an institute.” → “”
- ep7-03-shoe-cabinet.md: “exactly what Act II said networks do:” → “what networks had always done on the Peninsula:”
- ep7-03-shoe-cabinet.md: “Act IV will show it done with software.” → “”
- ep7-03-shoe-cabinet.md: “since Act II chapter 8 assembling” → “since Hoover's defeat in 1932 assembling”
- ep7-03-shoe-cabinet.md: “Act II chapter 5 argued that whoever gathers the documents acquires interpretive power.” → “Hoover had understood in 1919 that whoever gathers the documents acquires interpretive power.”
- ep7-03-shoe-cabinet.md: “the 1979 ERISA clarification from chapter 5,” → “the 1979 ERISA clarification,”
- ep7-03-shoe-cabinet.md: “the corridor described in chapter 4.” → “the defence corridor of Sunnyvale and Mountain View.”
- ep7-03-shoe-cabinet.md: “the campus unrest described in chapter 7 of this act,” → “the campus unrest of the late 1960s,”
- ep7-03-shoe-cabinet.md: “and it belongs in this chapter because it inverts the arrangement Act II described.” → “and it inverted the arrangement Terman had built.”
- ep7-03-shoe-cabinet.md: “, and Act IV is what happens when the people it benefits acquire the government.” → “.”
- ep7-06-paypal.md: “, and Act IV will show what that produces.” → “.”
- ep7-06-paypal.md: “Act I chapter 2 described a school converting a method into a certificate that states would buy; Act I chapter” → “Stanford had been built to issue exactly that kind of certificate.”
- ep7-06-paypal.md: “, and they are consequential enough that Act IV cannot be understood without them.” → “.”
- ep7-06-paypal.md: “ — and that Act IV is largely a record of what that substitution looks like when it succeeds.” → “.”
- ep7-06-paypal.md: “Act I chapter 6 described an examination that was formally open to all and practically available to families w” → “Admission to Stanford had long been formally open to all and practically available to families who could suppo”
- ep8-01-inauguration-facebook.md: “That is Act I chapter 10, and Collis Huntington was more candid about it.” → “Collis Huntington had done that in the 1870s, and was more candid about it.”
- ep8-01-inauguration-facebook.md: “covered by Act III,” → “since the 1970s,”
- ep8-01-inauguration-facebook.md: “Act I chapter 11 described a crowd” → “In 1877 there had been a crowd”
- ep8-01-inauguration-facebook.md: “The line from Act I chapter 11 is direct.” → “The line from the Chinese railroad crews of 1867 is direct.”
- ep8-02-palantir.md: “the mission register in Act I and the Hoover archive.” → “the mission register and the Hoover archive.”
- ep8-02-palantir.md: “Act II chapter 11 set out the university-contractor-state triangle and argued that federal money” → “Terman's university-contractor-state triangle had rested on the idea that federal money”
- ep8-02-palantir.md: “, which returns to Act III chapter 13.” → “, which is what the PayPal network supplied.”
- ep8-02-palantir.md: “the same one Act III chapter 11 gave about universities.” → “the same one Terman's generation gave about universities.”
- ep8-03-cambridge-china.md: “the same failure Act II ch. 8 documented for Hoover.” → “the same failure Hoover suffered in 1932.”
- ep8-03-cambridge-china.md: “reopens the channel Act II built.” → “reopens the channel Terman built.”
- ep8-03-cambridge-china.md: “reopened the channel Act II built.” → “reopened the channel Terman built.”
- ep8-03-cambridge-china.md: “for the reasons chapter 3 of Act III described.” → “for the reasons the fabless model made inevitable.”
- ep8-03-cambridge-china.md: “That last item is Act I chapter 11 running again” → “That last item is 1882 running again”
- ep8-04-rosewood-daily.md: “This book has argued since Act II chapter 6 that a credential” → “A credential”
- ep8-04-rosewood-daily.md: “is an instrument for lowering the cost of trusting a stranger, and that its value derives” → “is an instrument for lowering the cost of trusting a stranger, and its value derives”
- ep8-04-rosewood-daily.md: “, and it is the tension Act II chapter 5 planted.” → “, the tension Hoover planted when he founded it.”
- ep8-04-rosewood-daily.md: “the same pressure Act I described.” → “the same pressure the founders faced.”
- ep8-04-rosewood-daily.md: “the corridor described in Act III continued” → “the corridor continued”
- ep8-06-compute-thesis.md: “Fabrication, from chapter 2 of this act, is” → “Fabrication is”
- ep8-06-compute-thesis.md: “the fabless model that Act III traced from Nike's” → “the fabless model that ran from Nike's”
- ep8-06-compute-thesis.md: “the content moderation system of chapter 3 applied” → “the content moderation system applied”
- ep8-06-compute-thesis.md: “Act I chapter 10 gives prominence” → “Episode 3 gives prominence”
- ep8-06-compute-thesis.md: “particularly in Act I and in the parts of Act III that” → “particularly in Episodes 1 to 4 and in the parts of Episode 7 that”

## 7. Remnant stub sections cut

These are headings left with a lone sentence after dedupe.

- ep2-04 *The Surveyor*: Washington, The chairs empty (×2), The surveys, Davis's conclusion, Gadsden, Eight years of nothing. The full versions stay in *Vacant Chairs*.
- ep2-02 *The Store*: Both chairs, The workforce, What the monopoly then did. These are 1862–69 material; the full versions are in *The Surveyor*, *The Summit* and *Ten Miles*.
- ep1-03 *Paper State*: The merchants (the full version is in *Rancho*).
- ep1-05 *Nine Days*: Who captured the surplus, The catastrophe, What California took away (the full versions are in *The Store*).
- ep2-03 *Vigilance*: the second, stub copies of The precedent, The important detail, The water and the land, Who had no standing.

## 8. Citations moved to per-episode endnotes

- Inline author-date parentheticals were stripped from the prose and written to `rewrite/endnotes/ep1.md`…`ep8.md` and `coda.md`. Each note is keyed by chapter and the few words before the citation. The build appends them after each episode's last chapter as "Notes to Episode N".
- 170 endnotes were kept. 98 parentheticals cited only internal project files (`repo ch. 2-09`, `timeline.md`, `appendix-b-ledger.qmd`, `rewrite/notes/…`). They were removed and not turned into endnotes.
- Other path strings removed from prose: "(timeline; repo ch. 2-01)" in The Tree; "as reconstructed in the secondary literature summarized in repo ch. 2-09" → "as historians have reconstructed them" and "The ledger in the project appendix…(appendix-b-ledger.qmd)" → "One reconstruction fixes a date…" in The Summit; the cut-material sentence in The rotunda.
- HTML comments (`<!-- kyle: … -->`, `<!-- bib: … -->`) are still in the chapter sources. The build strips them, as before.

## 9. Front matter and build (`build-manuscript.py`)

- Title is now "Cardinal" (was "Cardinal: Documentary Rewrite"), the byline is now "Kyle McAuliffe" (was "Kyle McAuliffe et al."), and the date line reads "Draft 1.1 · October 2026".
- Removed the duplicate inner title block ("# Cardinal / *Documentary rewrite — draft v1*").
- Contents: episode names now appear once, in bold, with chapter titles listed under them and no file names. The Coda is listed by its own title.
- Body: the `# Episode N` heading now appears only on the first chapter of each episode, not on every chapter. Source-file comments are no longer written.
- The old "Notes and Bibliography" block, which dumped raw BibTeX and repo paths, was removed and replaced by the per-episode endnotes.
- Output is now `Cardinal-documentary-draft-v1.1.md` / `.pdf`. The v1 files are untouched.

## 10. Specific fixes

- **Episode 5 duplicate:** cut the `## Bush's report` block in *Harvard Radio Research Lab / Internment*. "Terman read it as a business plan." now appears once, at the end of *Radio Lab*.
- **Lease date:** the sources (Stanford OTL history; OAC Varian Associates finding aid) say Varian signed a 99-year, 10-acre lease in **October 1951**, prepaid at $41,000, and moved into its building in **1953**.
  - *The Lease* dateline changed from "1953" to "October 1951". The lease/signature references are now 1951, and a sentence with the 1951 terms and the 1953 move was added.
  - Cut the "## 1953 again" restatement and the "cold open's signature in 1953" paragraph.
  - *East Palo Alto*: changed to "in October 1951 and moved in two years later". Cut "The episode's cold open signed a lease in 1953."
- **Crespí:** "His entries for the November halt describe the double redwood" now gives Crespí's actual description (level plain, oak and live oak, a good stream, "so very good and mellow that it can not be excelled", Bolton 1927). The tall redwood (*palo alto*) is credited to expedition tradition, and "The double redwood gave a landmark" became "The tall redwood…".
- **BackRub:** removed the repeated sentence "That's why Page called his system BackRub."

## 11. Not done / flagged for draft 2

- **Episode 8 restructure (deliberately not done):** *Compute* (~6,900 words) needs splitting. *The Oval Office* (~350 words, incoherent "First Trump administration" dateline, unsourced gigafactory claim) needs rewriting.
- **ep8-01 *The rotunda*:** after cleanup it is still mostly essay. The "Palo Alto, California. 2004." dateline now leads straight into 2025 analysis ("When does subliminal become explicit?"), and the Facebook 2004 material comes later. Needs a structural pass along with the rest of Episode 8.
- **ep2-04 *The Surveyor*:** the opening scene is only ~120 words. The chapter now runs scene → Both chairs → The subsidy → The workforce, and *Ten Miles* covers subsidy and Both chairs again in different words. Topic-level repetition remains.
- **Ep2 order:** *The Surveyor* (dated 1860–63) comes before *Vacant Chairs* (dated 1 July 1862, with flashbacks to the 1853–55 surveys). Consider swapping or re-dating.
- *Ten Miles* still has two "Both chairs" sections ("Both chairs, briefly" and "Both chairs (January 1863)").
- Many essay sections remain, e.g. ep7 *The assignment* (Nike/shoe cabinet), ep7 *PayPal* (credentialing argument), and most of Episode 8. They were not on the explicit cut list and need rewriting rather than cutting.
- Endnotes use context snippets rather than superscript markers. If you want numbered notes, switch to pandoc footnotes.

