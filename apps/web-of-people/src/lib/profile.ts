import type { Data, Rel } from './data';
import type { Status } from './types';
import { STATUS_LABEL, avatarHtml, citeHtml, esc, href, personPill } from './html';
import { timelineHtml } from './timeline';

const FAMILY_LABEL = { spouses: 'Spouse', parents: 'Parent', children: 'Child', siblings: 'Sibling' } as const;

function relRow(label: string, r: Rel, d: Data): string {
  const who = r.other
    ? `<a href="${esc(href('/people/' + r.other.id + '/'))}" data-person="${esc(r.other.id)}"><b>${esc(r.other.name)}</b></a>`
    : `<b>${esc(r.rel.bLabel ?? 'Not named in the notes')}</b> <span class="not-recorded">(not named in the notes)</span>`;
  return `<li><span class="fam-rel">${esc(label)}</span> ${who}<span class="dim"> · ${esc(r.label)}</span>
    <details><summary>Source</summary>${r.rel.cites.map(citeHtml).join('')}</details></li>`;
}

export function familyHtml(d: Data, id: string): string {
  const f = d.family(id);
  const rows: string[] = [];
  for (const k of ['parents', 'spouses', 'children', 'siblings'] as const) {
    for (const r of f[k]) rows.push(relRow(FAMILY_LABEL[k], r, d));
  }
  const inTree = !d.local && d.families().some((c) => c.includes(id));
  const treeLink = inTree ? `<p><a class="btn" href="${esc(href('/family/' + id + '/'))}">Open family tree</a></p>` : '';
  if (!rows.length) {
    return `<p class="not-recorded">No family relationships for this person are recorded in the repository notes. Parents, spouse and children are left blank rather than guessed.</p>`;
  }
  const missing: string[] = [];
  if (!f.parents.length) missing.push('parents');
  return `<ul class="fam-list">${rows.join('')}</ul>${missing.length ? `<p class="not-recorded">Not recorded: ${missing.join(', ')}.</p>` : ''}${treeLink}`;
}

const OTHER_LABEL: Record<string, string> = {
  mentor: 'Mentor / student',
  partners: 'Partners',
  employer: 'Employer / employee',
  recruited: 'Recruited',
  conflict: 'Conflict',
};

export function connectionsHtml(d: Data, id: string): string {
  const rels = d.relsFor(id).filter((r) => !['spouse', 'parent', 'sibling'].includes(r.rel.type));
  const rows = rels
    .map(
      (r) =>
        `<li><span class="fam-rel">${esc(OTHER_LABEL[r.rel.type] ?? r.rel.type)}</span> ${
          r.other ? `<a href="${esc(href('/people/' + r.other.id + '/'))}" data-person="${esc(r.other.id)}"><b>${esc(r.other.name)}</b></a>` : '<b>Not named</b>'
        }<span class="dim"> · ${esc(r.label)}</span><details><summary>Source</summary>${r.rel.cites.map(citeHtml).join('')}</details></li>`,
    )
    .join('');
  const shared = [...d.connected(id).entries()]
    .filter(([, v]) => v.events.length)
    .sort((a, b) => b[1].events.length - a[1].events.length)
    .map(([pid, v]) => ({ p: d.byId.get(pid)!, n: v.events.length }))
    .filter((x) => x.p);
  return `${rows ? `<ul class="fam-list">${rows}</ul>` : ''}${
    shared.length
      ? `<p class="dim" style="margin-bottom:0">Appear in the same recorded event:</p><ul class="pill-list">${shared.map((s) => personPill(s.p)).join('')}</ul>`
      : ''
  }${!rows && !shared.length ? '<p class="not-recorded">No connections to other people in this dataset.</p>' : ''}`;
}

export function placesHtml(d: Data, id: string): string {
  const ps = d.placesFor(id);
  if (!ps.length) return '<p class="not-recorded">No places recorded.</p>';
  return `<ul class="pill-list">${ps
    .map(
      (x) =>
        d.local
          ? `<li><a href="#" tabindex="-1" aria-disabled="true" style="pointer-events:none">${esc(x.place.name)} <span class="dim">· ${x.events.length}</span></a></li>`
          : `<li><a href="${esc(href('/places/' + x.place.id + '/'))}">${esc(x.place.name)} <span class="dim">· ${x.events.length}</span></a></li>`,
    )
    .join('')}</ul>`;
}

export function orgsHtml(d: Data, id: string): string {
  const rows = d.affiliationsFor(id);
  if (!rows.length) return '<p class="not-recorded">No organisations recorded.</p>';
  return `<ul class="fam-list">${rows
    .map(({ aff, org }) => {
      const name = d.local ? esc(org.name) : `<a href="${esc(href('/organisations/' + org.id + '/'))}">${esc(org.name)}</a>`;
      return `<li><span class="fam-rel">${esc(aff.role)}</span> ${name}<details class="role-src"><summary>Source${aff.cites.length === 1 ? '' : 's'}</summary>${aff.cites.map(citeHtml).join('')}</details></li>`;
    })
    .join('')}</ul>`;
}

export function sourcesHtml(d: Data, id: string): string {
  const files = new Map<string, number>();
  const web = new Map<string, number>();
  const bump = (c: { f?: string; url?: string }) => {
    if (c.url) web.set(c.url, (web.get(c.url) ?? 0) + 1);
    else if (c.f) files.set(c.f, (files.get(c.f) ?? 0) + 1);
  };
  const p = d.byId.get(id)!;
  p.roleCites?.forEach(bump);
  d.affiliationsFor(id).forEach(({ aff }) => aff.cites.forEach(bump));
  d.eventsFor(id).forEach((e) => e.cites.forEach(bump));
  d.relsFor(id).forEach((r) => r.rel.cites.forEach(bump));
  if (!files.size && !web.size) return '<p class="not-recorded">No sources.</p>';
  const title = new Map(d.ds.sources.map((s) => [s.path, s.title]));
  const wtitle = new Map((d.ds.webSources ?? []).map((s) => [s.url, `${s.title} (${s.publisher})`]));
  const repoItems = [...files.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(
      ([f, n]) =>
        `<li><b>${esc(title.get(f) ?? f)}</b> <span class="dim">· ${n} citation${n === 1 ? '' : 's'}</span><br><code class="dim" style="font-size:.8rem;word-break:break-all">${esc(f)}</code></li>`,
    );
  const webItems = [...web.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(
      ([u, n]) =>
        `<li><a href="${esc(u)}" rel="noopener"><b>${esc(wtitle.get(u) ?? u)}</b></a> <span class="dim">· ${n} citation${n === 1 ? '' : 's'}</span><br><code class="dim" style="font-size:.8rem;word-break:break-all">${esc(u)}</code></li>`,
    );
  return `<ul class="fam-list">${[...repoItems, ...webItems].join('')}</ul>`;
}

export interface ProfileOpts {
  heading?: 'h1' | 'h2';
}

export function profileHtml(d: Data, id: string, o: ProfileOpts = {}): string {
  const p = d.byId.get(id);
  if (!p) return '<p>Person not found.</p>';
  const h = o.heading ?? 'h1';
  const evs = d.eventsFor(id);
  const counts = new Map<Status, number>();
  for (const e of evs) counts.set(e.status, (counts.get(e.status) ?? 0) + 1);
  const badges = [...counts.entries()].map(([s, n]) => `<span class="badge">${n} ${STATUS_LABEL[s].toLowerCase()}</span>`).join('');
  const gaps = d.gaps(id);
  const credit = p.portrait
    ? `<p class="credit">Portrait${p.portrait.medium ? ` (${esc(p.portrait.medium)})` : ''}: ${esc(p.portrait.author)}, ${esc(p.portrait.date)}. ${esc(p.portrait.license)}${p.portrait.licenseUrl ? ` (<a href="${esc(p.portrait.licenseUrl)}" rel="noopener">licence</a>)` : ''}. <a href="${esc(p.portrait.pageUrl)}" rel="noopener">${esc(p.portrait.source ?? 'Wikimedia Commons')}</a>. ${esc(p.portrait.scaled)}${p.portrait.rightsStatement ? ` ${esc(p.portrait.rightsStatement)}` : ''}</p>`
    : p.portraitGap
      ? `<p class="credit">No portrait: ${esc(p.portraitGap.why)}. Searched ${esc(p.portraitGap.checked)}: ${esc(p.portraitGap.searched)}.</p>`
      : '';
  return `<article class="profile" data-profile="${esc(id)}">
    <header class="profile-head">
      ${avatarHtml(p, 'portrait')}
      <div>
        <p class="eyebrow">${esc(d.lifeLabel(id))}</p>
        <${h}>${esc(p.name)}</${h}>
        ${p.role ? `<p class="role">${esc(p.role)}</p>` : '<p class="role not-recorded">Role not recorded</p>'}
        ${badges ? `<div class="badges">${badges}</div>` : ''}
      </div>
    </header>
    ${credit}
    ${gaps.length ? `<div class="gaps"><b>Gaps in the record.</b> ${gaps.map((g) => esc(g.text)).join(' · ')}</div>` : ''}
    ${p.roleCites?.length ? `<details class="role-src"><summary>Why this role</summary>${p.roleCites.map(citeHtml).join('')}</details>` : ''}
    <section aria-labelledby="h-tl-${esc(id)}"><${h === 'h1' ? 'h2' : 'h3'} id="h-tl-${esc(id)}">Timeline</${h === 'h1' ? 'h2' : 'h3'}>${timelineHtml(d, id)}</section>
    <section><${h === 'h1' ? 'h2' : 'h3'}>Family history</${h === 'h1' ? 'h2' : 'h3'}>${familyHtml(d, id)}</section>
    <section><${h === 'h1' ? 'h2' : 'h3'}>Connections</${h === 'h1' ? 'h2' : 'h3'}>${connectionsHtml(d, id)}</section>
    ${d.orgs.length ? `<section><${h === 'h1' ? 'h2' : 'h3'}>Organisations</${h === 'h1' ? 'h2' : 'h3'}>${orgsHtml(d, id)}</section>` : ''}
    <section><${h === 'h1' ? 'h2' : 'h3'}>Places</${h === 'h1' ? 'h2' : 'h3'}>${placesHtml(d, id)}</section>
    <section><${h === 'h1' ? 'h2' : 'h3'}>Sources</${h === 'h1' ? 'h2' : 'h3'}>${sourcesHtml(d, id)}</section>
  </article>`;
}
