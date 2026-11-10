import type { Dataset, EventKind, EventRec, Person, Place, Relationship } from './types';
import { slug } from './chrome';

export interface GEvent {
  tag: string;
  type?: string;
  value?: string;
  dateRaw?: string;
  place?: string;
  line: number;
  sources: string[];
}

export interface GPerson {
  xref: string;
  name: string;
  given: string;
  surname: string;
  sex?: string;
  events: GEvent[];
  line: number;
}

export interface GFam {
  xref: string;
  husb?: string;
  wife?: string;
  chil: string[];
  events: GEvent[];
  line: number;
}

export interface Parsed {
  version: string;
  charset: string;
  people: GPerson[];
  fams: GFam[];
  sources: Map<string, string>;
  warnings: string[];
}

interface Node {
  level: number;
  xref?: string;
  tag: string;
  value: string;
  line: number;
  kids: Node[];
}

const LINE = /^\s*(\d+)\s+(?:(@[^@\s]+@)\s+)?([A-Za-z0-9_]+)(?:[ \t](.*))?$/;

export function parseTree(text: string): { roots: Node[]; warnings: string[] } {
  const warnings: string[] = [];
  const roots: Node[] = [];
  const stack: Node[] = [];
  const src = text.replace(/^\uFEFF/, '').split(/\r\n|\n|\r/);
  src.forEach((raw, i) => {
    if (!raw.trim()) return;
    const m = LINE.exec(raw);
    if (!m) {
      if (warnings.length < 20) warnings.push(`Line ${i + 1} is not valid GEDCOM and was skipped.`);
      return;
    }
    const level = Number(m[1]);
    const node: Node = { level, xref: m[2], tag: m[3].toUpperCase(), value: m[4] ?? '', line: i + 1, kids: [] };
    if (node.tag === 'CONC' || node.tag === 'CONT') {
      const parent = stack[level - 1];
      if (parent) parent.value += (node.tag === 'CONT' ? '\n' : '') + node.value;
      return;
    }
    while (stack.length > level) stack.pop();
    if (level === 0) roots.push(node);
    else if (stack[level - 1]) stack[level - 1].kids.push(node);
    else if (warnings.length < 20) warnings.push(`Line ${i + 1} has no parent record and was skipped.`);
    stack[level] = node;
  });
  return { roots, warnings };
}

const EVENT_TAGS = new Set([
  'BIRT', 'CHR', 'BAPM', 'DEAT', 'BURI', 'CREM', 'MARR', 'DIV', 'EVEN', 'RESI', 'OCCU', 'EDUC', 'GRAD', 'IMMI', 'EMIG', 'NATU', 'CENS', 'RETI', 'PROB', 'WILL', 'ADOP', 'ENGA', 'ANUL',
]);

function toEvent(n: Node, srcs: Map<string, string>): GEvent {
  const sub = (t: string) => n.kids.find((k) => k.tag === t);
  const sources = n.kids
    .filter((k) => k.tag === 'SOUR')
    .map((k) => (k.value.startsWith('@') ? srcs.get(k.value) ?? k.value : k.value || k.kids.find((x) => x.tag === 'TITL')?.value || ''))
    .filter(Boolean);
  return {
    tag: n.tag,
    type: sub('TYPE')?.value,
    value: n.value && n.value !== 'Y' ? n.value : undefined,
    dateRaw: sub('DATE')?.value,
    place: sub('PLAC')?.value,
    line: n.line,
    sources,
  };
}

export function parseGedcom(text: string): Parsed {
  const { roots, warnings } = parseTree(text);
  const head = roots.find((r) => r.tag === 'HEAD');
  const version = head?.kids.find((k) => k.tag === 'GEDC')?.kids.find((k) => k.tag === 'VERS')?.value ?? 'unknown';
  const charset = head?.kids.find((k) => k.tag === 'CHAR')?.value ?? (version.startsWith('7') ? 'UTF-8' : 'unknown');
  if (!head) warnings.push('No HEAD record: this may not be a GEDCOM file.');
  if (charset && !/^(UTF-?8|UNICODE|ASCII|ANSI)$/i.test(charset) && charset !== 'unknown') {
    warnings.push(`Character set ${charset} is not supported. Names with accents may look wrong; export as UTF-8 if you can.`);
  }
  const sources = new Map<string, string>();
  for (const r of roots) if (r.tag === 'SOUR' && r.xref) sources.set(r.xref, r.kids.find((k) => k.tag === 'TITL')?.value ?? r.xref);

  const people: GPerson[] = [];
  const fams: GFam[] = [];
  for (const r of roots) {
    if (r.tag === 'INDI' && r.xref) {
      const nameNode = r.kids.find((k) => k.tag === 'NAME');
      let given = nameNode?.kids.find((k) => k.tag === 'GIVN')?.value ?? '';
      let surname = nameNode?.kids.find((k) => k.tag === 'SURN')?.value ?? '';
      let full = '';
      if (nameNode) {
        const m = /^(.*?)\s*\/([^/]*)\/\s*(.*)$/.exec(nameNode.value);
        if (m) {
          given = given || m[1].trim();
          surname = surname || m[2].trim();
          full = [given, surname, m[3].trim()].filter(Boolean).join(' ');
        } else {
          full = nameNode.value.trim();
          given = given || full;
        }
      }
      if (!full || /^[?]+$/.test(full)) full = 'Unnamed person';
      const events = r.kids.filter((k) => EVENT_TAGS.has(k.tag)).map((k) => toEvent(k, sources));
      people.push({ xref: r.xref, name: full, given, surname, sex: r.kids.find((k) => k.tag === 'SEX')?.value, events, line: r.line });
    } else if (r.tag === 'FAM' && r.xref) {
      fams.push({
        xref: r.xref,
        husb: r.kids.find((k) => k.tag === 'HUSB')?.value,
        wife: r.kids.find((k) => k.tag === 'WIFE')?.value,
        chil: r.kids.filter((k) => k.tag === 'CHIL').map((k) => k.value),
        events: r.kids.filter((k) => EVENT_TAGS.has(k.tag)).map((k) => toEvent(k, sources)),
        line: r.line,
      });
    }
  }
  if (!people.length) warnings.push('No people (INDI records) were found in this file.');
  return { version, charset, people, fams, sources, warnings };
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

function onePart(s: string): string | null {
  const m = /^(?:(\d{1,2})\s+)?(?:(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+)?(\d{3,4})(?:\/\d{2})?$/i.exec(s.trim());
  if (!m) return null;
  const y = m[3].padStart(4, '0');
  if (m[2]) {
    const mo = String(MONTHS.indexOf(m[2].toUpperCase()) + 1).padStart(2, '0');
    if (m[1]) return `${y}-${mo}-${m[1].padStart(2, '0')}`;
    return `${y}-${mo}`;
  }
  if (m[1]) return null;
  return y;
}

export function convertDate(raw: string | undefined): { date: string | null; note?: string } {
  if (!raw || !raw.trim()) return { date: null, note: 'No date in the file' };
  const s = raw.trim().replace(/\s+/g, ' ');
  const plain = onePart(s);
  if (plain) return { date: plain };
  let m = /^(ABT|ABOUT|EST|CAL)\.? (.+)$/i.exec(s);
  if (m) {
    const d = onePart(m[2]);
    if (d) return { date: d, note: m[1].toUpperCase().startsWith('ABT') || m[1].toUpperCase() === 'ABOUT' ? 'about' : m[1].toUpperCase() === 'EST' ? 'estimated' : 'calculated' };
  }
  m = /^BEF\.? (.+)$/i.exec(s);
  if (m) {
    const d = onePart(m[1]);
    if (d) return { date: d, note: 'before this date' };
  }
  m = /^AFT\.? (.+)$/i.exec(s);
  if (m) {
    const d = onePart(m[1]);
    if (d) return { date: d, note: 'after this date' };
  }
  m = /^(?:BET\.?|FROM) (.+?) (?:AND|TO) (.+)$/i.exec(s);
  if (m) {
    const a = onePart(m[1]);
    const b = onePart(m[2]);
    if (a && b && /^\d{4}$/.test(a) && /^\d{4}$/.test(b)) return { date: `${a}/${b}` };
    if (a) return { date: a, note: `between ${m[1]} and ${m[2]}` };
  }
  return { date: null, note: `As written in the file: ${s}` };
}

const KIND: Record<string, EventKind> = {
  BIRT: 'birth', CHR: 'birth', BAPM: 'birth', DEAT: 'death', BURI: 'death', CREM: 'death', MARR: 'life', DIV: 'life',
  OCCU: 'work', RETI: 'work', EDUC: 'education', GRAD: 'education',
};

const TITLE: Record<string, string> = {
  BIRT: 'Born', CHR: 'Christened', BAPM: 'Baptised', DEAT: 'Died', BURI: 'Buried', CREM: 'Cremated', MARR: 'Married', DIV: 'Divorced',
  RESI: 'Lived', OCCU: 'Occupation', EDUC: 'Education', GRAD: 'Graduated', IMMI: 'Immigrated', EMIG: 'Emigrated', NATU: 'Naturalised',
  CENS: 'Census', RETI: 'Retired', PROB: 'Probate', WILL: 'Will', ADOP: 'Adopted', ENGA: 'Engaged', ANUL: 'Marriage annulled', EVEN: 'Event',
};

export interface ImportOptions {
  filename: string;
  includeLiving?: boolean;
  now?: number;
}

export interface ImportReport {
  people: number;
  events: number;
  relationships: number;
  places: number;
  livingHidden: number;
  warnings: string[];
  version: string;
  charset: string;
}

export function toDataset(parsed: Parsed, o: ImportOptions): { ds: Dataset; report: ImportReport } {
  const now = o.now ?? new Date().getFullYear();
  const file = `import:${o.filename}`;
  const yearOf = (g: GPerson, tags: string[]) => {
    for (const e of g.events) if (tags.includes(e.tag)) {
      const d = convertDate(e.dateRaw).date;
      if (d) return Number(d.slice(0, 4));
    }
    return null;
  };
  const living = new Set<string>();
  for (const g of parsed.people) {
    const dead = g.events.some((e) => ['DEAT', 'BURI', 'CREM'].includes(e.tag));
    const by = yearOf(g, ['BIRT', 'CHR', 'BAPM']);
    if (!dead && (by == null || by > now - 110)) living.add(g.xref);
  }
  const hide = (x: string) => !o.includeLiving && living.has(x);

  const people: Person[] = [];
  const idOf = new Map<string, string>();
  const used = new Set<string>();
  for (const g of parsed.people) {
    if (hide(g.xref)) continue;
    let id = 'i-' + (slug(g.name) || 'person');
    while (used.has(id)) id += '-' + g.xref.replace(/@/g, '');
    used.add(id);
    idOf.set(g.xref, id);
    people.push({ id, name: g.name, given: g.given, surname: g.surname, portrait: null, imported: true });
  }

  const places = new Map<string, Place>();
  const place = (name?: string) => {
    if (!name) return null;
    const id = 'pl-' + slug(name);
    if (!places.has(id)) places.set(id, { id, name, kind: 'place' });
    return id;
  };

  const events: EventRec[] = [];
  const push = (who: string[], ev: GEvent, subject?: string, extra = '') => {
    if (ev.tag === 'EVEN' && !ev.type && !ev.value) return;
    const { date, note } = convertDate(ev.dateRaw);
    const base = TITLE[ev.tag] ?? ev.tag;
    const detail = ev.value ?? (ev.tag === 'EVEN' ? ev.type : undefined);
    const title = `${ev.tag === 'EVEN' && ev.type ? ev.type : base}${detail && ev.tag !== 'EVEN' ? ': ' + detail : ''}${extra}`.trim();
    events.push({
      id: `imp-${events.length + 1}`,
      people: who,
      date,
      ...(note ? { dateNote: note } : {}),
      kind: KIND[ev.tag] ?? 'other',
      ...(subject ? { subject } : {}),
      title,
      place: place(ev.place),
      ...(ev.place ? { locationText: ev.place } : {}),
      status: 'IMPORTED',
      ...(ev.sources.length ? { note: `Source named in the file: ${ev.sources.join('; ')}` } : {}),
      origin: 'import',
      cites: [{ f: file, q: `${ev.tag}${ev.dateRaw ? ' ' + ev.dateRaw : ''}${ev.place ? ' @ ' + ev.place : ''}`.trim(), line: ev.line }],
    });
  };

  for (const g of parsed.people) {
    const id = idOf.get(g.xref);
    if (!id) continue;
    for (const ev of g.events) push([id], ev, ['DEAT', 'BURI', 'CREM'].includes(ev.tag) ? id : undefined);
  }

  const rels: Relationship[] = [];
  for (const f of parsed.fams) {
    const h = f.husb ? idOf.get(f.husb) : undefined;
    const w = f.wife ? idOf.get(f.wife) : undefined;
    const cites = [{ f: file, q: `FAM ${f.xref}`, line: f.line }];
    if (h && w) {
      rels.push({ id: `imp-sp-${f.xref}`, type: 'spouse', a: h, b: w, label: 'Spouses in a family record', cites, fromGroup: false });
      for (const ev of f.events) push([h, w], ev);
    } else {
      for (const ev of f.events) {
        const who = [h, w].filter(Boolean) as string[];
        if (who.length) push(who, ev);
      }
    }
    for (const c of f.chil) {
      const cid = idOf.get(c);
      if (!cid) continue;
      for (const [pid, kind] of [[h, 'Father'], [w, 'Mother']] as const) {
        if (pid) rels.push({ id: `imp-pc-${f.xref}-${pid}-${cid}`, type: 'parent', a: pid, b: cid, label: `${kind} (from family record)`, cites, fromGroup: false });
      }
    }
  }

  const livingHidden = parsed.people.filter((g) => hide(g.xref)).length;
  const ds: Dataset = {
    meta: {
      title: `Imported: ${o.filename}`,
      repo: { url: '', branch: '' },
      counts: { people: people.length, events: events.length, relationships: rels.length, places: places.size, sources: 1 },
      notice: 'Imported in your browser from a family file. Nothing was uploaded. Facts are as written in the file and are not verified here.',
    },
    people,
    events,
    relationships: rels,
    places: [...places.values()],
    sources: [{ path: file, title: o.filename, kind: 'import', weight: 'Imported from a family-tree file. Not verified by this site.' }],
  };
  return {
    ds,
    report: {
      people: people.length,
      events: events.length,
      relationships: rels.length,
      places: places.size,
      livingHidden,
      warnings: parsed.warnings,
      version: parsed.version,
      charset: parsed.charset,
    },
  };
}

/** Serialise a parsed file back to GEDCOM 5.5.1 (used for round-trip tests and later export). */
export function writeGedcom(p: Parsed): string {
  const out: string[] = ['0 HEAD', '1 GEDC', '2 VERS 5.5.1', '2 FORM LINEAGE-LINKED', '1 CHAR UTF-8'];
  const ev = (e: GEvent) => {
    out.push(`1 ${e.tag}${e.value ? ' ' + e.value : ''}`);
    if (e.type) out.push(`2 TYPE ${e.type}`);
    if (e.dateRaw) out.push(`2 DATE ${e.dateRaw}`);
    if (e.place) out.push(`2 PLAC ${e.place}`);
  };
  for (const g of p.people) {
    out.push(`0 ${g.xref} INDI`, `1 NAME ${g.given} /${g.surname}/`);
    if (g.sex) out.push(`1 SEX ${g.sex}`);
    g.events.forEach(ev);
  }
  for (const f of p.fams) {
    out.push(`0 ${f.xref} FAM`);
    if (f.husb) out.push(`1 HUSB ${f.husb}`);
    if (f.wife) out.push(`1 WIFE ${f.wife}`);
    f.chil.forEach((c) => out.push(`1 CHIL ${c}`));
    f.events.forEach(ev);
  }
  out.push('0 TRLR');
  return out.join('\n') + '\n';
}

export const SAMPLE_GEDCOM = `0 HEAD
1 SOUR Web of People sample
1 GEDC
2 VERS 5.5.1
2 FORM LINEAGE-LINKED
1 CHAR UTF-8
0 @I1@ INDI
1 NAME Ada /Example/
1 SEX F
1 BIRT
2 DATE 4 MAR 1861
2 PLAC Exampleton
1 DEAT
2 DATE 1930
0 @I2@ INDI
1 NAME Ben /Example/
1 SEX M
1 BIRT
2 DATE ABT 1858
1 DEAT
2 DATE 1921
2 PLAC Exampleton
1 OCCU Cooper
0 @I3@ INDI
1 NAME Cora /Example/
1 SEX F
1 BIRT
2 DATE 1884
2 PLAC Exampleton
1 DEAT
2 DATE 1960
0 @I4@ INDI
1 NAME Dan /Example/
1 BIRT
2 DATE 1887
1 DEAT
2 DATE 1888
0 @I5@ INDI
1 NAME Eve /Sample/
1 SEX F
1 BIRT
2 DATE 1910
1 DEAT
2 DATE 1999
0 @I6@ INDI
1 NAME Frank /Sample/
1 BIRT
2 DATE 1908
1 DEAT
2 DATE 1980
0 @I7@ INDI
1 NAME Gail /Sample/
1 BIRT
2 DATE 1990
0 @F1@ FAM
1 HUSB @I2@
1 WIFE @I1@
1 CHIL @I3@
1 CHIL @I4@
1 MARR
2 DATE 1882
2 PLAC Exampleton
0 @F2@ FAM
1 HUSB @I6@
1 WIFE @I3@
1 CHIL @I5@
1 MARR
2 DATE 1907
0 TRLR
`;
