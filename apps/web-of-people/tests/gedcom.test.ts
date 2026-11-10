import { describe, expect, it } from 'vitest';
import { convertDate, parseGedcom, parseTree, SAMPLE_GEDCOM, toDataset, writeGedcom } from '../src/lib/gedcom';
import { makeData } from '../src/lib/data';

describe('GEDCOM dates', () => {
  const cases: [string, string | null, string | undefined][] = [
    ['4 MAR 1861', '1861-03-04', undefined],
    ['MAR 1861', '1861-03', undefined],
    ['1861', '1861', undefined],
    ['ABT 1858', '1858', 'about'],
    ['EST 1700', '1700', 'estimated'],
    ['BEF 1900', '1900', 'before this date'],
    ['AFT 1900', '1900', 'after this date'],
    ['BET 1850 AND 1860', '1850/1860', undefined],
    ['FROM 1850 TO 1860', '1850/1860', undefined],
    ['1750/51', '1750', undefined],
  ];
  it.each(cases)('%s', (raw, date, note) => {
    const r = convertDate(raw);
    expect(r.date).toBe(date);
    expect(r.note).toBe(note);
  });
  it('keeps unreadable dates as written and never invents one', () => {
    const r = convertDate('Spring of the big flood');
    expect(r.date).toBeNull();
    expect(r.note).toContain('Spring of the big flood');
  });
  it('missing date stays unknown', () => {
    expect(convertDate(undefined).date).toBeNull();
  });
});

describe('GEDCOM parsing', () => {
  it('joins CONC and CONT lines', () => {
    const { roots } = parseTree('0 HEAD\n0 @I1@ INDI\n1 NOTE first\n2 CONC part\n2 CONT second\n0 TRLR\n');
    const note = roots[1].kids[0];
    expect(note.value).toBe('firstpart\nsecond');
  });
  it('reads the sample file', () => {
    const p = parseGedcom(SAMPLE_GEDCOM);
    expect(p.version).toBe('5.5.1');
    expect(p.people).toHaveLength(7);
    expect(p.fams).toHaveLength(2);
    expect(p.warnings).toEqual([]);
    expect(p.people[0].given).toBe('Ada');
    expect(p.people[0].surname).toBe('Example');
  });
  it('warns, rather than crashing, on junk and unsupported character sets', () => {
    const p = parseGedcom('0 HEAD\n1 CHAR ANSEL\nthis is not gedcom\n0 @I1@ INDI\n1 NAME A /B/\n0 TRLR\n');
    expect(p.people).toHaveLength(1);
    expect(p.warnings.join(' ')).toMatch(/ANSEL/);
    expect(p.warnings.join(' ')).toMatch(/not valid GEDCOM/);
  });
  it('warns when a file is not GEDCOM at all', () => {
    const p = parseGedcom('hello world');
    expect(p.people).toHaveLength(0);
    expect(p.warnings.length).toBeGreaterThan(0);
  });
  it('strips a byte-order mark and reads CRLF', () => {
    const p = parseGedcom('\uFEFF0 HEAD\r\n1 GEDC\r\n2 VERS 7.0\r\n0 @I1@ INDI\r\n1 NAME Zed /Q/\r\n0 TRLR\r\n');
    expect(p.version).toBe('7.0');
    expect(p.people[0].name).toBe('Zed Q');
  });
});

describe('GEDCOM round trip', () => {
  it('parse, write, parse again gives the same people, events and families', () => {
    const a = parseGedcom(SAMPLE_GEDCOM);
    const b = parseGedcom(writeGedcom(a));
    const strip = (p: typeof a) => ({
      people: p.people.map((x) => ({ xref: x.xref, given: x.given, surname: x.surname, ev: x.events.map((e) => [e.tag, e.dateRaw, e.place, e.value]) })),
      fams: p.fams.map((f) => ({ xref: f.xref, husb: f.husb, wife: f.wife, chil: f.chil, ev: f.events.map((e) => [e.tag, e.dateRaw, e.place]) })),
    });
    expect(strip(b)).toEqual(strip(a));
  });
});

describe('GEDCOM to dataset', () => {
  it('hides possibly-living people by default and can include them', () => {
    const p = parseGedcom(SAMPLE_GEDCOM);
    const hidden = toDataset(p, { filename: 's.ged', now: 2026 });
    expect(hidden.report.livingHidden).toBe(1);
    expect(hidden.ds.people.map((x) => x.name)).not.toContain('Gail Sample');
    const shown = toDataset(p, { filename: 's.ged', now: 2026, includeLiving: true });
    expect(shown.ds.people.map((x) => x.name)).toContain('Gail Sample');
  });
  it('produces a consistent dataset the renderers can use', () => {
    const { ds } = toDataset(parseGedcom(SAMPLE_GEDCOM), { filename: 's.ged', now: 2026 });
    const ids = new Set(ds.people.map((x) => x.id));
    expect(ids.size).toBe(ds.people.length);
    for (const r of ds.relationships) {
      expect(ids.has(r.a)).toBe(true);
      expect(r.b && ids.has(r.b)).toBe(true);
    }
    for (const e of ds.events) {
      for (const pid of e.people) expect(ids.has(pid)).toBe(true);
      expect(e.status).toBe('IMPORTED');
      expect(e.cites[0].f.startsWith('import:')).toBe(true);
    }
    const d = makeData(ds);
    expect(d.families()[0].length).toBeGreaterThanOrEqual(4);
    expect(d.local).toBe(true);
  });
  it('keeps an unknown birth unknown and carries qualifiers into the note', () => {
    const { ds } = toDataset(parseGedcom(SAMPLE_GEDCOM), { filename: 's.ged', now: 2026 });
    const ben = ds.people.find((p) => p.name === 'Ben Example')!;
    const birth = ds.events.find((e) => e.people[0] === ben.id && e.kind === 'birth')!;
    expect(birth.date).toBe('1858');
    expect(birth.dateNote).toBe('about');
    const dan = ds.people.find((p) => p.name === 'Dan Example')!;
    expect(ds.events.filter((e) => e.people.includes(dan.id) && e.kind === 'death')).toHaveLength(1);
  });
});
