# Episode 7: The Road

## The garage

**Menlo Park, California. September 1998.**

Susan Wojcicki rented rooms in her house on Santa Margarita Avenue to make mortgage payments. She charged Google $1,700 a month to rent the garage and several rooms. (Levy 2011, ch. 1) <!-- bib: TODO -->

The garage myth had a rent receipt.

Larry Page and Sergey Brin incorporated Google on September 4, 1998. The index already worked better than anything else on the web. They were still Stanford graduate students, still using the story of academic search, still holding the warning in their own published appendix that advertising would distort results. The company name was a joke about scale — a googol of pages — misspelled into a trademark.

Inside the house on Santa Margarita, servers stacked where a car should have been, the company looked like every Valley origin story: young engineers, cheap rent, an algorithm that worked. Outside, the institution that owned the algorithm was preparing the license that would make the garage a branch office of the university's portfolio.

## Sand Hill again

The venture meetings happened in the glass-walled buildings in Menlo Park's Sand Hill Road. (Levy 2011, ch. 2) <!-- bib: TODO -->

Kleiner Perkins and Sequoia Capital both invested in June 1999 — rival firms sharing a round, which Valley gossip treated as a sign that the deal was obvious. The money was not only money. It was board discipline, hiring introductions, and credibility with the next fund on the road. Tom Perkins's firm sat four minutes from the quad where the crawl had started. Don Valentine's firm had funded Apple and Cisco from the same oak-shaded parking lots. The gate recognized its own.

John Doerr, Kleiner's best-known partner, would join Google's board and become one of the company's outward faces in the press. The term sheets those firms used had been drafted a few miles away, at Wilson Sonsini and at the banks that lent against venture signatures rather than against revenue. A startup's institutional world still fit inside a short drive.

Stanford's technology licensing office finalized the PageRank deal in parallel: exclusive license, cash, and equity. The university was now both landlord of the research and shareholder of the product. When the company later raised larger rounds, the same road that had financed Genentech from a fired associate's desperation now financed search from a graduate project that had already failed to sell itself to Excite.

## Leaving the campus

Page and Brin did not drop out immediately. The transition from dissertation to company was negotiated the way Reimers negotiated patents — slowly, with lawyers, with the institution's cut explicit. They moved off the departmental machines that had triggered bandwidth complaints and onto hardware paid for by investors. The BackRub demo page on Stanford's server would become a historical artifact; the crawl would continue on private capacity.

The culture they brought with them was academic in one way that would matter for decades: they believed measurement could settle arguments. They also brought the portal era's blind spot Bell had articulated — that keeping users inside a property might conflict with answering questions honestly. They would resolve the tension in favor of answers, then sell the answers.

## The revenue problem

Google's initial business plan was to license its search technology to portals, and it did — to Yahoo, among others. The revenue was insufficient to support the infrastructure the index required, and the infrastructure requirement grew with the web. They tried other approaches. The venture funding brought expectations of a real business model. <!-- kyle: ch/4-12 -->

Advertising was what worked, and it worked so well that within a few years no alternative was conceivable.

The turn was not cynical if you credit the constraints. Serving the whole web required clusters of machines that doubled in size faster than licensing fees grew. Portal partners wanted white-label search, not a rival brand. The investors on Sand Hill Road wanted a margin that could scale with queries, not a fee per partner. The appendix in the 1998 paper had described the hazard of mixing search with ads. The balance sheet described the hazard of mixing search with insolvency.

## AdWords

Advertisers bid on search terms. But the auction did not simply sell the top position to the highest bidder. Google introduced a quality score — a measure of how likely users were to click a given advertisement — and ranked ads by the combination of bid and quality. An advertiser with a more relevant advertisement could outrank one paying more. <!-- kyle: ch/4-12 -->

Advertisers paid per click rather than per impression, which meant they paid only when the system had actually delivered someone.

The result aligned three interests that ordinarily conflict. Users got advertisements that were more relevant. Advertisers paid for outcomes rather than exposure. And Google captured a share of the value of every commercial intention expressed anywhere in its index.

Refined between 2000 and 2002, the auction was elegant in the way railroad tariffs were elegant: a small rule change at the bottleneck reshaped everything downstream. Excite had wanted stickiness. Google sold departure — then taxed the departure at the moment of intent.

## Intent as an asset

A magazine advertisement reaches people who happen to be reading a magazine. A television advertisement reaches people who happen to be watching. Both are sold on demographics, which is a guess about who is present. <!-- kyle: ch/4-12 -->

A search query is a person stating, in their own words, at a specific moment, what they are trying to find. It is a declared intention, timestamped and immediately actionable, and its commercial value is correspondingly enormous.

Google did not invent human intention. It occupied the position between a stated desire and the market that could satisfy it, and priced the passage — which is what the Southern Pacific did to freight, what the studios did to films, and what Microsoft did to applications.

Each of these is the same toll in a different medium. This one turned out to be the largest, because everyone wants something.

## The infrastructure underneath

Serving search at web scale on commodity hardware required a different kind of computing, and Google built it: enormous numbers of inexpensive machines, software that assumed individual machines would fail constantly, and distributed systems for storing and processing data across all of them. The published papers describing these systems in the early 2000s were read very widely and were reimplemented in the open, which is where a substantial part of the modern data infrastructure industry comes from. <!-- kyle: ch/4-12 -->

The company then built its own data centres, sited for electricity and cooling along rivers and in counties that wanted the tax base, and eventually designed its own chips. A company that begins by owning an index ends by owning the physical capacity to compute at scale. The garage on Santa Margarita was already a fiction by the time the first custom silicon arrived.

## The appendix, again

They wrote that advertising funding creates a mixed incentive and that the bias would be difficult for users to detect. Twenty-five years later, competition authorities on two continents had reached similar conclusions in formal decisions. The European Commission fined Google for abusing dominance in comparison shopping in June 2017, and for practices tied to its Android mobile operating system in July 2018. The United States Department of Justice filed a civil antitrust suit alleging monopolization of search and search advertising in October 2020. Those proceedings documented preferential placement, exclusive default agreements with device makers, and payments to secure search placement — including arrangements with Apple that made Google the default on most phones in the United States. (European Commission 2017, 2018; U.S. DOJ 2020)

Both the regulators' findings and the appendix described the same hazard: a search engine that serves advertisers will shape what users see.

The two documents sit next to each other, written by the same people about the same system, a generation apart. The juxtaposition is the argument.

## The excluded

Users, whose behavioural data constitutes the asset and who receive the service in exchange, on terms nobody negotiated and few have read.

Publishers, whose content is the raw material of the index and whose relationship with their own audiences was intermediated by a company that eventually competed with them for the same advertising revenue.

And advertisers, bidding in an auction whose rules and reserve prices they cannot inspect — a fact that has been the subject of litigation on both sides of the Atlantic.

The toll had moved again. It was no longer on the rail. It was on the question.

Susan Wojcicki would later run the company's advertising business and then YouTube. The woman who cashed the seventeen-hundred-dollar garage check became one of the people who sold the intention the garage had been built to index. Stanford kept the shares. Sand Hill kept the board seats. The road kept the gate.

## Yahoo and the licensing winter

Before AdWords, there was Yahoo. Google's first real revenue came from powering other people's search boxes — a subcontractor to portals that still believed they owned the customer relationship. Yahoo drove traffic; Google drove quality; the checks were too small to fund the index doubling every few months.

Levy's account of the period is a sequence of near-miss business models: custom search appliances, enterprise contracts, sponsorships that did not scale. Each attempt treated search as a component. The breakthrough treated search as the marketplace itself — every query an auction lot.

The portal era ended slowly, then all at once. Users learned to type `google.com` instead of waiting for a portal to curate the morning. Defaults on browsers and toolbars became the new stickiness. Google paid for placement where Excite had refused to buy relevance. The company that Bell thought was too good at answering questions became too good at owning the moment the question was asked.

## June 1999

When Kleiner Perkins and Sequoia closed the June 1999 round, the company was less than a year old and already famous among technologists. The valuation was hot by the standards of the time; the terms were standard by the standards of Sand Hill Road: preferred shares, board seats, protective provisions, the right to block a sale that did not return the fund's model.

Doerr's presence on the board linked Google to the lineage of Netscape, Amazon, and Sun — firms that had taught the Valley how to scale on venture gasoline. Valentine's Sequoia linked it to Apple and Cisco — firms that had taught the Valley how to survive the transition from product to platform.

Stanford sat on the cap table through the licensing office, not through the venture funds. That separation mattered publicly — the university could claim it had enabled research, not picked winners — and it mattered privately, because the shares were worth more than any royalty the OTL had ever collected from a single license.

## Quality score

The AdWords auction is easier to describe than to invent. Bidding alone produces garbage: the highest bidder might be the least relevant page. Google's quality score reweighted bids by predicted click-through rate, rewarding ads that users actually wanted to click. Advertisers paid per click, not per impression, which aligned Google's revenue with demonstrated intent rather than with accidental eyeballs.

The mechanism turned the search box into a commodities exchange where the commodity was a moment of desire. Farmers' markets price apples by weight. AdWords priced curiosity by the word.

## Stanford's sale

After the August 2004 initial public offering, Stanford began selling its Google shares into the market. Press accounts and university chronologies place the proceeds in the hundreds of millions — a nine-figure return on OTL paperwork and on NSF grants that had paid graduate students to improve libraries.

The transaction closed the loop Reimers had opened with Cohen–Boyer: public science, private title, public markets, institutional endowment. The difference was concentration. Biotech could host many firms on one patent family. Search, at scale, wanted one index.

## Bell's echo

George Bell had wanted a search engine that was eighty percent as good as the competition — good enough to keep users wandering the lobby. Google built an engine that was better than good enough to leave, then built an advertising machine that profited from the leaving.

Excite would merge, stumble, and disappear from the daily life of the internet. The portal Bell protected would lose to the search box. The road that had funded Excite would fund Google's competitors and then fund Google's acquirers and then fund the next generation of founders who met in the same glass-walled buildings Levy described on Sand Hill Road.

## Night on Santa Margarita

In the first months on Wojcicki's property, the company was still small enough that the founders cooked meals, argued about ranking tweaks, and slept near the humming drives. The mythmakers would later photograph the garage as if it were a birthplace independent of Stanford. The rent receipt said otherwise: a landlord, a mortgage, a suburban street minutes from the investors who would price the round.

The street signs on the way to Sand Hill Road already named railroad men, university presidents, and donors. Page and Brin drove past them without reading. They were building the index that would make reading optional — the answer before the question finished typing.

The appendix still said advertising would distort search. The auction made distortion profitable. The shares made distortion permanent for the institution that had hosted BackRub when the network failed on December 4, 1997, and apologized on a Stanford web page that the failure was beyond the students' control.

When the company moved out of the garage, it did not move out of the corridor. Every later round, every default payment, every data-centre acre would still route through the same geography: graduate students from the Gates building, term sheets from Sand Hill, patents from the OTL, pension money from the ERISA clarification that had enlarged the funds waiting in those glass-walled offices. The garage was a photograph. The gate was the business. PayPal's parking lot was next, and the young men there would learn the same lesson in money before they learned it in politics. The road would fund both exits.

## The IPO line

When Google went public in 2004, the registration statement listed Stanford among the largest beneficiaries of the licensing deal — not as a footnote, but as a shareholder whose sales would be watched by analysts. The endowment's gain was not charity. It was rent on the algorithm, collected after the public had paid for the research that trained the inventors.

Knight would later return to campus to dedicate a business school building named for his shoe fortune. Page and Brin would return as trustees, donors, and symbols. The garage on Santa Margarita would be photographed for annual reports. The rent receipt would disappear into myth.

The road would remember all of it as entrepreneurship. The ledger would remember it as succession.

