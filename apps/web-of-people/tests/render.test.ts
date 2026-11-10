import { describe, expect, it } from 'vitest';
import { data, makeData } from '../src/lib/data';
import { profileHtml } from '../src/lib/profile';
import { axisSvg, timelineHtml } from '../src/lib/timeline';
import { treeSvg } from '../src/lib/tree';
import { allCharts } from '../src/lib/charts';
import { formatDate, parseDate } from '../src/lib/dates';
import { parseGedcom, SAMPLE_GEDCOM, toDataset } from '../src/lib/gedcom';
import { buildGraph } from '../src/lib/graph';
import { esc } from '../src/lib/html';

const bad = /undefined|NaN|\[object|Infinity/;

describe('dates', () => {
  it('formats partial dates without inventing precision', () => {
    expect(formatDate('1884-03-13')).toBe('13 March 1884');
    expect(formatDate('1899-02')).toBe('February 1899');
    expect(formatDate('1874')).toBe('1874');
    expect(formatDate('1894/1895')).toBe('1894–1895');
    expect(formatDate(null)).toBe('Date not recorded');
  });
  it('orders a year before the months inside it', () => {
    expect(parseDate('1861')!.start).toBeLessThan(parseDate('1861-06-28')!.start);
  });
});

describe('renderers', () => {
  it('renders every profile without broken values', () => {
    for (const p of data.people) {
      const html = profileHtml(data, p.id);
      expect(html, p.id).toContain(esc(p.name));
      expect(html, p.id).not.toMatch(bad);
    }
  });
  it('never shows a biography the data does not hold', () => {
    const html = profileHtml(data, 'bill-duvall');
    expect(html).toMatch(/Birth: not recorded/);
    expect(html).toMatch(/Parents: not recorded/);
  });
  it('draws a timeline axis for everyone with a dated event, with finite coordinates', () => {
    for (const p of data.people) {
      const dated = data.eventsFor(p.id).some((e) => parseDate(e.date));
      const svg = axisSvg(data, [p.id]);
      expect(svg, p.id).not.toMatch(bad);
      if (dated) expect(svg).toContain('data-ev=');
      expect(timelineHtml(data, p.id)).not.toMatch(bad);
    }
  });
  it('two-lane comparison renders both people', () => {
    const svg = axisSvg(data, ['frederick-terman', 'bill-hewlett']);
    expect(svg).toContain('Fred Terman');
    expect(svg).toContain('Bill Hewlett');
  });
  it('lays out every family tree without overlaps', () => {
    const comps = data.families();
    expect(comps.length).toBeGreaterThanOrEqual(5);
    for (const comp of comps) {
      const svg = treeSvg(data, comp);
      expect(svg).not.toMatch(bad);
      const boxes = [...svg.matchAll(/class="card[^"]*" transform="translate\(([\d.]+) ([\d.]+)\)"/g)].map((m) => [Number(m[1]), Number(m[2])]);
      expect(boxes.length).toBeGreaterThanOrEqual(comp.length);
      for (let i = 0; i < boxes.length; i++)
        for (let j = i + 1; j < boxes.length; j++) {
          const clash = Math.abs(boxes[i][0] - boxes[j][0]) < 212 && Math.abs(boxes[i][1] - boxes[j][1]) < 80;
          expect(clash, `${comp.join(',')} cards ${i}/${j}`).toBe(false);
        }
    }
  });
  it('shows a placeholder card for an unnamed relative', () => {
    const comp = data.families().find((c) => c.includes('robert-noyce'))!;
    expect(treeSvg(data, comp)).toContain('Not named in the notes');
  });
  it('lays out a three-generation imported tree', () => {
    const d = makeData(toDataset(parseGedcom(SAMPLE_GEDCOM), { filename: 's.ged', now: 2026 }).ds);
    const comp = d.families().sort((a, b) => b.length - a.length)[0];
    const svg = treeSvg(d, comp);
    expect(svg).toContain('Generation 3');
    expect(svg).not.toMatch(bad);
  });
  it('charts render with finite numbers', () => {
    for (const c of allCharts(data)) {
      expect(c).toContain('<svg');
      expect(c).not.toMatch(bad);
    }
  });
});

describe('graph model', () => {
  it('has a node per person, stated links, and place hubs only where three or more people share a place', () => {
    const g = buildGraph(data, { shared: true, places: true, relatives: true, mobile: false });
    expect(g.nodes.filter((n) => n.kind === 'person')).toHaveLength(data.people.length);
    const main = buildGraph(data, { shared: true, places: true, mobile: false });
    expect(main.nodes.filter((n) => n.kind === 'person')).toHaveLength(data.people.filter((p) => !p.relative).length);
    const hubs = g.nodes.filter((n) => n.kind === 'place');
    expect(hubs.length).toBeGreaterThan(3);
    for (const h of hubs) expect(h.deg).toBeGreaterThanOrEqual(3);
    const stated = g.links.filter((l) => !['shared', 'placelink'].includes(l.type));
    expect(stated.length).toBe(data.relationships.filter((r) => r.b).length);
  });
  it('draws an organisation hub only where two or more shown people belong to it', () => {
    const g = buildGraph(data, { shared: false, places: false, orgs: true, mobile: false });
    const hubs = g.nodes.filter((n) => n.kind === 'org');
    expect(hubs.length).toBeGreaterThanOrEqual(3);
    const shown = new Set(g.nodes.filter((n) => n.kind === 'person').map((n) => n.id));
    for (const h of hubs) {
      const id = h.id.replace(/^org:/, '');
      expect(data.membersOf(id).filter((m) => shown.has(m.person.id)).length, id).toBeGreaterThanOrEqual(2);
    }
    expect(buildGraph(data, { shared: false, places: false, mobile: false }).nodes.some((n) => n.kind === 'org')).toBe(false);
  });
  it('turning the toggles off removes those links', () => {
    const g = buildGraph(data, { shared: false, places: false, mobile: false });
    expect(g.links.some((l) => l.type === 'shared' || l.type === 'placelink')).toBe(false);
    expect(g.nodes.some((n) => n.kind === 'place')).toBe(false);
  });
});
