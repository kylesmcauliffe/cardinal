export type Status = 'VERIFIED' | 'NEEDS SOURCE' | 'CONTESTED' | 'DRAFT' | 'IMPORTED';

export type EventKind =
  | 'birth' | 'death' | 'life' | 'education' | 'work' | 'founding' | 'law' | 'publication' | 'conflict' | 'other';

export type RelType = 'spouse' | 'parent' | 'sibling' | 'mentor' | 'partners' | 'employer' | 'recruited' | 'conflict';

export interface Cite {
  f: string;
  q: string;
  line?: number;
}

export interface Portrait {
  file: string;
  author: string;
  license: string;
  licenseUrl: string | null;
  commonsUrl: string;
  commonsTitle: string;
  date: string;
  scaled: string;
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

export interface SourceRec {
  path: string;
  title: string;
  kind: string;
  weight: string;
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
}
