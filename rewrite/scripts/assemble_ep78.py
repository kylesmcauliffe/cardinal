#!/usr/bin/env python3
"""Assemble Ep 7-8 chapters from books/cardinal/ch/*.qmd prose blocks."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CH = ROOT / "books/cardinal/ch"
OUT = ROOT / "rewrite/chapters"


def strip_qmd(path: Path) -> str:
    text = path.read_text(encoding="utf-8")
    # Drop YAML-like callout blocks
    text = re.sub(r":::.*?\n", "", text)
    text = re.sub(r":::\s*\n", "", text)
    # Drop headers with {#...}
    text = re.sub(r"^# .+ \{#.+\}\s*\n", "", text, flags=re.M)
    text = re.sub(r"^## .+\s*\n", "", text, flags=re.M)
    # Remove chapter-meta lines
    lines = []
    for line in text.splitlines():
        if line.strip().startswith("{.chapter"):
            continue
        if line.strip() == "---":
            continue
        if "chapter-question" in line:
            break
        lines.append(line)
    return "\n".join(lines).strip()


def wc(s: str) -> int:
    return len(s.split())


def write(name: str, body: str):
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / name
    path.write_text(body.strip() + "\n", encoding="utf-8")
    print(f"{name}: {wc(body)} words")


# --- Episode 7 ---

ep7_01 = """# Episode 7: The Road

## Sand Hill

**Menlo Park, California. 1972.**

The fog was still on the foothills when Eugene Kleiner and Tom Perkins signed the lease. The address was 3000 Sand Hill Road — low buildings, parking lots, oak trees, a view of the coastal range, and nothing that announced what the place would become (Berlin 2017, ch. 15). <!-- bib: TODO -->

Sand Hill Road runs west from the freeway at Menlo Park, past the Stanford campus edge, and up into the hills. There is nothing to look at.

A very large share of the world's consequential technology funding over the last fifty years has passed through those buildings. <!-- kyle: ch/4-05 -->

Nobody in the office that morning knew they were founding a toll gate. They knew they were opening a partnership. Kleiner had been one of the eight who walked out on William Shockley in 1957; Perkins had run Hewlett-Packard's computer division. They were operators from the semiconductor industry who had moved into finance, which meant they could evaluate technical claims and knew personally most of the people worth funding (Berlin 2017, ch. 15). <!-- bib: TODO -->

The capital and the industry were the same social network. They had been colleagues.

## Why the money had to change form

Consider financing a semiconductor company in 1957.

It has no revenue. It has no collateral, because its assets are a lease, some equipment, and eight men. It has enormous variance: it will either be worth a great deal or nothing, with little in between.

A bank cannot lend against that. Arthur Rock's insight in the Fairchild financing was to take equity instead. If the enterprise fails, the money is gone. If it succeeds, the return is unbounded. <!-- kyle: ch/4-05 -->

Rock said he backed people rather than businesses, on the argument that the plan would change and the founders would not.

## 1972

Two firms were founded in 1972, both on Sand Hill Road.

Kleiner Perkins was formed by Kleiner and Perkins. Sequoia Capital was founded by Don Valentine, who had been head of marketing at Fairchild and then at National Semiconductor.

Note the provenance. These were not financiers who had moved into technology. They were the industry, rearranged.

The physical clustering followed immediately, and it followed for a reason that is not obvious until stated: the asset being traded is judgement about people, and judgement about people does not travel. A partner needs to sit in the room, know the founder's former manager, and hear what the market is saying this week.

Proximity to the deal flow — which meant proximity to Stanford — was the whole business.

Four minutes from the campus that supplies the founders. That is the geography of the chokepoint, and it has not moved.

## The public money leg

The industry's scale changed because of a regulatory clarification, and this is the part that almost every account leaves out.

The Employee Retirement Income Security Act of 1974 imposed a prudent man standard on pension fund investment, and fund managers read it as prohibiting anything speculative. Venture capital, which was speculative by construction, was effectively closed off from the largest pool of investable capital in the country.

In 1979 the Department of Labor issued a clarification. The prudent man standard, it said, applied to the portfolio as a whole rather than to each investment in isolation, which meant a pension fund could allocate a small percentage to high-variance assets without breaching its duty.

The effect was immediate and enormous. Capital committed to venture funds rose by an order of magnitude over the following few years, and the dominant source of it became pension money — the retirement savings of American workers, institutional and public alike. <!-- kyle: ch/4-05 -->

So the capital chokepoint runs on public and quasi-public money in exactly the way the railroad did, and the beneficiaries of those pension funds have no say in how it is deployed and mostly do not know it is being deployed this way.

## Gatekeeping, not investing

Money is the smallest part of what a term sheet allocates. It sets the valuation, which determines what the founders keep. It assigns board seats, which determines who can remove them. It carries liquidation preferences, which determine who is paid first if the company sells.

A company that cannot get through Sand Hill Road does not merely lack money. It lacks access to customers, executives, and subsequent capital, all of which are routed through the same small number of partnerships.

The Southern Pacific decided which towns in the Central Valley would exist by deciding where the line ran. Sand Hill Road decides which companies exist by deciding which ones can scale. The mechanism is identical. <!-- kyle: ch/4-05 -->

## Genentech

Bob Swanson was twenty-nine years old when Kleiner Perkins let him go.

He had been a partner at the firm for less than a year. He was intense, impatient, and convinced that recombinant DNA — the technique Stanley Cohen at Stanford and Herbert Boyer at UCSF had published — could be turned into products if someone would finance the attempt (Berlin 2017, ch. 15). <!-- bib: TODO -->

Swanson called Boyer. In 1976 they incorporated Genentech in South San Francisco, on the other side of the hills from the road where Swanson had just lost his job.

The company would become the commercial proof that biology could be financed like software: long timelines, binary outcomes, enormous returns on the ones that worked. It would go public in 1980, on patents filed while Swanson was still trying to get Kleiner Perkins to return his calls.

A fired kid at the gate had become a biotech empire. The road had turned him away. The science had not.

He would not live to see the full shape of what he started. Swanson died in 1999, at fifty-two. Genentech outlived him by decades.

## Who does not get through

Studies of venture funding over the past several decades have consistently found that the overwhelming majority of American venture capital goes to companies in a handful of metropolitan areas, that the share going to companies founded solely by women has run in low single-digit percentages, and that the share going to Black founders has been lower still. [TK: cite most recent NVCA or academic study with year]

The industry's explanation is pattern matching: partners fund founders who resemble founders who have succeeded before. That explanation is honest and it describes a mechanism for reproducing an existing distribution indefinitely.

Rock said he backed people rather than businesses. The question the corridor leaves is which people, and the answer has been consistent for fifty years.

The April Third Movement had occupied a laboratory on campus three years earlier. The university would cut SRI loose in 1970. The military work moved off-campus without slowing down.

The rebellion had not stopped the machine. It had made the machine look less like a weapons lab.

On Sand Hill Road, the gate was already open.
"""

ep7_02 = """# Episode 7: The Road

## Pong

**Sunnyvale, California. 1972.**

Al Alcorn had built a cabinet with one game on the screen: two paddles, a dot, a score counter. He called it Pong. He installed a prototype in a bar in Burlingame to see if anyone would put quarters in it.

They did.

Nolan Bushnell had hired Alcorn at Atari because he was young, cheap, and good with a soldering iron. The company was still small enough that the engineer who built the game was also the man who fixed it when the coin mechanism jammed. [TK: Berlin ch. 20, Atari founding details]

What Pong proved was not that Americans wanted video games. Shopkeepers had known that since pinball. What it proved was that a hit could be manufactured in a garage, installed in a bar, and scaled — if someone could raise the money to build more cabinets than one engineer could solder.

"'We didn't need a business plan for Pong or the VCS,' Alcorn replied. He needed one now." (Berlin 2017, ch. 20) <!-- bib: TODO -->

The moment a garage becomes a corporation is the moment the corporation needs Sand Hill Road.

## The road answers

Venture capital in the 1970s was still learning what it was for. Semiconductors had been the template: brilliant engineers, impossible physics, a market that did not exist until the product existed.

Consumer electronics looked different. Margins were thinner. Fashion mattered. A game could be a phenomenon in 1973 and obsolete in 1974.

The firms on Sand Hill Road funded Atari anyway, because the pattern from Fairchild still applied: back the people, accept that the product would change, and own a piece of the upside if the upside arrived.

Atari's story would end in corporate wreckage — sold, split, buried under layers of debt and litigation that belong to a different book. What mattered for this corridor was simpler: a new category had passed through the gate, and the gate had learned to recognize categories.

## Reimers

**Stanford, California. 1974.**

Niels Reimers ran Stanford's Office of Technology Licensing out of a small suite of rooms that most faculty walked past without noticing. His job, in the years before Bayh–Dole, was to persuade professors that the university had an interest in what they invented — and to persuade companies that Stanford would not sue them if they licensed honestly.

Recombinant DNA was not an invention in the usual sense. It was a technique for cutting and splicing genetic material, published by Cohen and Boyer in 1973, funded principally by the National Institutes of Health. The public had paid for the science. The question of who would own the applications was still open.

Reimers filed patent applications on the Cohen–Boyer work on behalf of Stanford and UCSF. The filing was criticized inside the university for its potential to undermine Stanford's fundamental mission — the phrase appears in the record of the debate, and the criticism was not wrong (Berlin 2017, pt. 3). <!-- bib: TODO -->

A research university was about to patent life itself.

Reimers's answer, reduced to its structure, was that if Stanford did not patent and license, someone else would — and the public would get neither revenue nor control. Whether that answer justified the filing is a question this book does not need to settle. The filing happened. The patents issued. An industry followed.

## Bayh–Dole

**Washington, D.C. December 1980.**

The least famous consequential statute in this book is the Bayh–Dole Act of 1980.

It provided that universities, small businesses, and non-profits could take title to inventions made with federal research funding. Before it, the default in much of the government was that publicly funded inventions belonged to the public. After it, the university patents the result of research the taxpayer paid for, licenses it to a company, and collects a royalty. <!-- kyle: ch/4-10 -->

Every research university in the United States built a technology licensing office. Stanford already had one — established in 1970 — which meant it was positioned when the statute arrived.

The Cohen–Boyer patents were already in hand. Stanford licensed the technology broadly and non-exclusively at modest rates rather than granting an exclusive licence, and it earned the universities a very large sum over the life of the patents — a few hundred million dollars, split between the two institutions. <!-- kyle: ch/4-10 -->

The non-exclusive approach is worth marking, because it is the best version of the arrangement. The technology was available to anyone who wanted it, an entire industry was built on it, and the universities were paid.

The case against is equally structural. The public funded the research through NIH grants, and then bought the resulting products at prices set by patent holders. Royalties flowed to institutions rather than to the agency that paid for the work.

## Genentech's IPO

Genentech went public in October 1980. The stock rose sharply on the first day of trading on a company with essentially no product revenue.

What that offering established is that biology could be financed like software. The venture model from Sand Hill Road had found a second industry.

Life became an asset class in 1980, on a Stanford and UCSF patent, funded from the road that Kleiner and Perkins had opened eight years earlier.

Reimers had filed the papers. Congress had changed the law. Swanson had been fired and then proved the firers wrong.

The gate was no longer only for chips.
"""

# Continue in second part of script...
if __name__ == "__main__":
    write("ep7-01-sand-hill.md", ep7_01)
    write("ep7-02-pong-patents.md", ep7_02)
