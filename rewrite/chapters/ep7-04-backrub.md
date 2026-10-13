# Episode 7: The Road

## BackRub

**Stanford, California. January 1997.**

The Gates Computer Science building was quiet after hours, but the network was not. Larry Page had been crawling the web from Stanford's machines for months. He called the project BackRub. That's why Page called his system BackRub. (Levy 2011, ch. 1) <!-- bib: TODO -->

The name was literal. A search engine that ranked pages by who linked to them was measuring the web's back links — the citations of the open internet, the way footnotes work in a journal. Sergey Brin had joined the effort; together they were graduate students on federally supported research, turning a library problem into an engineering one.

On the public project page, still hosted under the Stanford domain that winter, BackRub described itself as a "web crawler" built for the Digital Library Project in the computer science department. It promised a demo searching titles across more than sixteen million URLs. A note apologized for outages: a local network failure beyond the team's control had taken the service down on December 4, 1997. The crawl was not a secret hobby. It was visible, documented, and hungry for bandwidth the department could measure. (Stanford BackRub site, Wayback Machine, 10 Dec 1997)

## The insight

Search engines in 1997 ranked pages primarily by the text on them, which meant anyone could rank highly by repeating a word. PageRank used a different signal: the structure of links between pages. A page linked to by many pages is probably useful, and a link from a page that is itself heavily linked counts for more than one from a page nobody reads. It is a recursive measure of authority, and it was much harder to fake because it depended on the behaviour of other people. <!-- kyle: ch/4-12 -->

The results were obviously better, and anyone who used the web in 1998 remembers the difference.

Page had started from academic citations. Brin brought the statistical machinery. Their adviser, Terry Winograd, had seen search as a serious research direction when many faculty still treated the web as a toy. The NSF-backed Digital Libraries work gave them cover, computers, and time. It also gave Stanford a claim.

## Excite

Vinod Khosla was on the board of Excite, the portal that had grown out of the same Stanford orbit a few years earlier. Khosla had co-founded Sun Microsystems and was now a partner at Kleiner Perkins on Sand Hill Road — the same corridor Eugene Kleiner had opened in 1972, a few minutes from the quad. (Berlin 2017, ch. 15) <!-- bib: TODO -->

Page wanted to finish his doctorate. He also believed BackRub could make money immediately if someone with traffic would license it. In January 1997 he emailed Khosla a plan for Excite to buy the technology. "Excite's total outlay would be $1.6 million, including $300,000 to Stanford for the license." (Levy 2011, ch. 1) <!-- bib: TODO -->

Stanford's cut sat inside the pitch like a line item on a grocery receipt. The university was not an afterthought. It was part of the price.

Khosla arranged the meeting that mattered. Excite had taken venture money and, like many Valley firms of the period, had been told to hire adult supervision. George Bell, a magazine executive, ran the company now. In Bell's office the Stanford team opened two windows on the same monitor: Excite's search and BackRub's. They typed the query "Internet."

Levy's account of what happened next is a parable about the wrong metric. Excite's results, according to the contemporaries Levy interviewed, surfaced pages where the English word appeared among unrelated text. BackRub returned pages that actually explained how to use browsers — the answer a person typing "Internet" in 1997 likely wanted. Bell worried that a search engine which solved the query too well would send users away. Portals in that era sold advertising against time on site; relevance was secondary to stickiness. (Levy 2011, ch. 1; paraphrase in rewrite/notes/Levy-In-the-Plex.md)

Excite passed.

Khosla reportedly floated a lower cash figure — seven hundred fifty thousand dollars in some accounts — but no deal closed. The road had seen the algorithm. The portal chose its business model instead.

## Reimers

Niels Reimers was not in the room at Excite. He did not need to be. His office at Stanford's technology licensing shop had already learned the Cohen–Boyer lesson: federally funded science, filed early, licensed broadly, could return hundreds of millions to the university. (Berlin 2017, pt. 3) <!-- bib: TODO -->

When Reimers filed on recombinant DNA, critics inside Stanford said the application risked undermining the university's fundamental mission. The same tension applied to PageRank. A public institution was about to patent the map of the public web, developed on its machines with public grants, and lease it back to its own students.

Reimers's structural answer, reduced to its bones, was that if Stanford did not capture the title someone else would. Whether that justified the capture is a moral question. The institutional question was simpler: Bayh–Dole had made capture legal, and capture was now routine.

## Stanford's position

The university owned the patent.

PageRank was developed on federally funded research at Stanford — the Digital Libraries project, supported by the National Science Foundation among others — and under the Bayh–Dole arrangement the university took title. It would license the patent to the company exclusively, in exchange for fees and shares. Patent 6,285,999, "Method for node ranking in a linked database," lists Lawrence Page as inventor and Stanford as assignee. (rewrite/research/chronology.md; Levy 2011, ch. 1–2)

The equity leg mattered as much as the license fee. Chronologies of the deal report roughly 1.8 million shares to Stanford in exchange for exclusive rights — the university becoming a shareholder in the chokepoint its own students built. After the 2004 initial public offering, Stanford would sell most of those shares for on the order of three hundred thirty-six million dollars. <!-- kyle: ch/4-12 -->

That transaction is the entire book in a single line item. Federal research funding produces an invention; a statute assigns the invention to the university; the university licenses it to a company founded by its own doctoral students; the company becomes one of the most valuable enterprises on earth; and the university collects a nine-figure return.

Public money in, private monopoly out, institution enriched, elite reproduced. There is no step in that sequence that is hidden, illegal, or even unusual.

## The paper

The paper that described Google contains an appendix explaining why Google should not exist.

Sergey Brin and Larry Page published "The Anatomy of a Large-Scale Hypertextual Web Search Engine" in 1998. Its final appendix argues that advertising-funded search engines are inherently biased toward the advertisers and away from the needs of consumers, that the bias is insidious because it is difficult for users to detect, and that these incentives mean a search engine of this kind will be crafted to serve the advertiser rather than the searcher. <!-- kyle: ch/4-12 -->

They concluded that it is crucial to have a competitive search engine that is transparent and in the academic realm.

Then they built the largest advertising-funded search engine in history.

They would need a garage, venture capital on Sand Hill Road, and a business model before the appendix caught up with them. Excite had already shown what the university's three-hundred-thousand-dollar line item looked like when a buyer walked away. The next buyer would not walk away. The shares would matter more than the license fee.

Nobody in Bell's office knew they had just declined the passage everyone would soon need to pay for.

## The department notices

Graduate students had run heavy jobs on shared clusters before. Page and Brin's crawl was different because it did not end. The web in 1997 was smaller than it would become, but it was already larger than any single machine could hold in memory. Every pass across the graph added disks, threads, and outbound requests that showed up in departmental logs.

Administrators asked polite questions first. How long would the experiment run? Could the crawl be throttled? Could the index live on machines paid for by the Digital Library grant rather than by the general pool? The questions were reasonable. They were also previews of the fights the company would later have with universities, publishers, and governments: who pays for the copy, and who owns the index?

Page and Brin were not the first Stanford students to treat the campus as a laboratory for a product. Phil Knight had written a shoe paper in a classroom a generation earlier. Bob Swanson had walked out of Kleiner Perkins with recombinant DNA in his pocket. The difference in 1997 was scale on the network. A crawl was not a pair of Tigers in a trunk. It was a continuous drain on a commons everyone else needed for email.

## What Excite bought instead

Excite was not stupid. It was a child of the same soil: Stanford engineers, venture money, a portal strategy built for an era when nobody knew which page a user would open first. Portals wanted search as a feature, not as a destination. They wanted users to linger among banner ads, chat rooms, and headlines assembled by editors.

Bell's stickiness argument, as Levy reconstructs it, was honest about the business. A perfect search engine is a exit door. Excite's shareholders had paid for a hotel lobby.

Khosla's role in the episode is a reminder that Sand Hill Road is not only a funder of new companies. It is a board member of old ones, a broker between graduate students and incumbents, a person who can schedule the meeting where a crawl becomes a acquisition target. When Excite said no, Khosla did not stop taking calls from Page. The road keeps the relationship even when the deal dies.

## Patent pending

By the time the 1998 paper appeared at a conference, the commercial path was already drawn. Stanford filed for patent protection on PageRank; the inventors listed Page; the assignee was the Board of Trustees. The exclusive license to Google would follow incorporation, but the direction of travel was set: the university would not release the method into the public domain the way early internet protocols had been released.

Defenders of Bayh–Dole would later point to Genentech and to the non-exclusive Cohen–Boyer licenses as proof that the system could spread wealth without creating monopolies. Search would be a harder case. One winner could index the whole web; network effects would concentrate queries on a single engine; the patent was a moat around the moat.

Brin and Page's appendix warned that advertising would distort rankings. They were writing as academics. Reimers was filing as a landlord. Kleiner Perkins was listening as an investor. Each was telling the truth about a different part of the same machine.

## The name on the door

Google was still months away. BackRub still lived on a Stanford server, with a banner announcing the Digital Library Project. The Excite number — $1.6 million, $300,000 to Stanford — had failed to clear Bell's stickiness test.

The algorithm worked. The portal metrics said that was the problem.

In a few months the project would leave the `.stanford.edu` address. It would not leave the institution. The shares were already implicit in the license Reimers was preparing. Sand Hill Road had seen the demo. The department had seen the bandwidth bill.

The next chapter would be a garage with a rent receipt, and venture partners meeting in glass-walled offices four minutes from the quad where the crawl began.

## AltaVista and the old gods

Before Google, the web had other priests. AltaVista, born in a Palo Alto lab, had taught users that search could be fast. Yahoo had taught them that search could be a feature inside a directory. Excite had taught them that search could be bundled with news and weather and stock quotes.

Each incumbent optimized for the business it already had. None wanted an engine so honest that users left immediately. Page and Brin optimized for relevance because they were not yet responsible for banner-ad revenue on a portal homepage. They were responsible for a dissertation committee, a licensing office, and a venture capitalist who had watched Excite say no.

The bake-off in Bell's office was the hinge. If Excite had bought BackRub for $1.6 million — if the three hundred thousand to Stanford had cleared — the algorithm might have been smothered inside a stickiness metric before the public ever learned to type a standalone URL. The failure of the sale preserved the engine for a company that would later make leaving the site the whole point.

That was luck only from Excite's perspective. From Stanford's perspective it was the second chance to price the same patent. From Sand Hill's perspective it was proof that the best deals are the ones the incumbents reject.

Winograd had framed the work as library science while the crawl still fit inside the Digital Library mandate. The market would not cooperate. When the crawl hit sixteen million URLs on the public demo, the project was already larger than most startups' products. The department's network failure notice on December 4 was a reminder that infrastructure built for teaching was carrying freight meant for commerce.

Page kept a copy of the Excite email with the $300,000 line item. Brin kept improving the ranking. Khosla kept returning calls. Reimers kept filing. The road kept collecting tolls whether or not the portal understood it was standing on a bridge.

## Brin

Sergey Brin arrived in the story as the partner who could make Page's idea run at scale — rewriting code, arguing about mathematics, testing the ranking on live queries at odd hours. Their dynamic was legendarily abrasive in the way graduate partnerships often are: two people who disagree in private so the product can agree in public.

Brin had come to Stanford from Maryland by way of an undergraduate degree and a family that had fled the Soviet Union — a biography that would later be packaged for IPO roadshows as evidence of American meritocracy. In 1997 he was simply another student on the cluster, watching the crawl eat disks.

When Excite passed, both men still had the option of finishing doctorates and publishing more papers. The failure of the sale did not force incorporation immediately. It forced a question: if portals would not buy relevance, who would pay for it? The answer would take another year and a garage. The question itself was already worth more than Bell had offered.

## The Digital Library grant

The NSF line on the grant paperwork was bland: improve access to information. The implementation was a bot that copied the web. Every federal dollar that paid for graduate student time on the cluster was a dollar the public had already spent before any venture capitalist wrote a check. Bayh–Dole then assigned the output to the university. Sand Hill Road would later assign the valuation.

That sequence — public grant, private title, venture price, public markets — was not a betrayal of Stanford's mission in the eyes of the people running the licensing office. It was the mission after 1980. Cohen–Boyer had proved the model in biology. BackRub would prove it in links. The only surprise was how quickly the second proof scaled.

In January 1997 the Excite email put a number on the proof: $1.6 million total, $300,000 to Stanford. The number would look quaint before the decade ended. In the moment it was enormous — enough to buy a portal's attention, enough to make the university's share visible before incorporation, enough to show anyone reading the thread that the institution intended to be paid.

The crawl would keep running after Excite said no. The department would keep noticing. Kleiner Perkins would keep its office on Sand Hill Road, four minutes from the machine room where the web was being copied one link at a time.

