export type Status = 'VERIFIED' | 'NEEDS SOURCE' | 'CONTESTED' | 'DRAFT' | 'IMPORTED';

export type EventKind =
  | 'birth' | 'death' | 'life' | 'education' | 'work' | 'founding' | 'law' | 'publication' | 'conflict' | 'other';

export type RelType = 'spouse' | 'parent' | 'sibling' | 'mentor' | 'partners' | 'employer' | 'recruited' | 'conflict';

export type WebSourceKind = 'primary' | 'reference' | 'scholarly' | 'institutional' | 'tertiary';

/**
 * A citation is either a repository file (`f`) or an external web page (`url`).
 * Either way `q` is a verbatim passage that the tests find in the source.
 */
export interface Cite {
  f?: string;
  q: string;
  line?: number;
  url?: string;
  title?: string;
  publisher?: string;
  kind?: WebSourceKind;
}

export interface Portrait {
  file: string;
  author: string;
  license: string;
  licenseUrl: string | null;
  /** The page the licence and attribution were read from (a Wikimedia Commons file page unless `source` says otherwise). */
  pageUrl: string;
  pageTitle: string;
  date: string;
  scaled: string;
  /** Original file on Commons (the app serves a scaled copy). */
  fileUrl?: string;
  /** What the image is, in words: "photograph, c. 1870", "oil portrait", "engraving". */
  medium?: string;
  /** Why we are sure it shows this person (a note or quote from the file page). */
  subjectEvidence?: string;
  /** Date the licence and subject were checked on the file page. */
  verifiedOn?: string;
  /** Where the image comes from when it is not Wikimedia Commons, e.g. "Internet Archive". */
  source?: string;
  /** How the licence was worked out when the page carries no licence field. */
  rightsStatement?: string;
}

export interface Person {
  id: string;
  name: string;
  short?: string;
  given: string;
  surname: string;
  birthSurname?: string;
  birthSurnameCites?: Cite[];
  role?: string;
  roleCites?: Cite[];
  portrait: Portrait | null;
  /** Why no portrait is shown, when one was looked for and none was found. */
  portraitGap?: { searched: string; why: string; checked: string };
  /** A relative named only through a family link: kept out of the web unless "Show relatives" is on. */
  relative?: boolean;
  /** Set on imported people so the UI can say where they came from. */
  imported?: boolean;
}

export interface EventRec {
  id: string;
  people: string[];
  date: string | null;
  dateNote?: string;
  kind: EventKind;
  subject?: string;
  title: string;
  place: string | null;
  locationText?: string;
  status: Status;
  /** Set when this pass changed a status the ledger carried (the ledger itself is not edited). */
  ledgerStatus?: Status;
  /** The date the ledger row carries, when an external source moved the event to a better-supported date. */
  ledgerDate?: string;
  /** What the second research pass found when it differed from the manuscript note. */
  revisionNote?: string;
  why?: string;
  ledgerNote?: string;
  note?: string;
  origin: 'ledger' | 'curated' | 'import';
  cites: Cite[];
}

export interface Relationship {
  id: string;
  type: RelType;
  a: string;
  b: string | null;
  bLabel?: string;
  label: string;
  cites: Cite[];
  fromGroup: boolean;
}

export interface Place {
  id: string;
  name: string;
  kind: string;
  lat?: number;
  lon?: number;
  coordNote?: string;
}

/** An organisation (university, company, railroad). Only present when sourced. */
export interface Org {
  id: string;
  name: string;
  kind: string;
  /** What the organisation is, in a sentence the sources support. */
  summary: string;
  cites: Cite[];
}

/** A sourced link between a person and an organisation. */
export interface Affiliation {
  id: string;
  person: string;
  org: string;
  /** In words: "Founder", "First president", "Student". */
  role: string;
  cites: Cite[];
}

export interface SourceRec {
  path: string;
  title: string;
  kind: string;
  weight: string;
}

export interface WebSource {
  url: string;
  title: string;
  publisher: string;
  kind: WebSourceKind;
  retrieved: string;
  cites: number;
}

export interface Dataset {
  meta: {
    title: string;
    repo: { url: string; branch: string };
    counts: Record<string, number>;
    notice: string;
    [k: string]: unknown;
  };
  people: Person[];
  events: EventRec[];
  relationships: Relationship[];
  places: Place[];
  sources: SourceRec[];
  webSources?: WebSource[];
  orgs?: Org[];
  affiliations?: Affiliation[];
}
