import { esc, href } from './html';

export const NAV: [string, string, string][] = [
  ['web', 'Web', '/'],
  ['people', 'People', '/people/'],
  ['family', 'Family', '/family/'],
  ['surnames', 'Surnames', '/surnames/'],
  ['places', 'Places', '/places/'],
  ['organisations', 'Organisations', '/organisations/'],
  ['charts', 'Charts', '/charts/'],
  ['import', 'Import', '/import/'],
  ['sources', 'Sources', '/sources/'],
];

export function slug(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const MARK = `<svg width="38" height="38" viewBox="0 0 38 38" aria-hidden="true"><g fill="none" stroke="#f6efe9" stroke-width="2.4"><path d="M9 28 19 9l10 19M9 28h20"/></g><g fill="#8c1515" stroke="#f6efe9" stroke-width="2.4"><circle cx="9" cy="28" r="5"/><circle cx="19" cy="9" r="5"/><circle cx="29" cy="28" r="5"/></g></svg>`;

export function headerHtml(current: string): string {
  const series = href('/').startsWith('/web') ? `<a class="series" href="/">The series</a>` : '';
  return `<header class="mast"><div class="mast-in">
    <a class="brand" href="${esc(href('/'))}">${MARK}<span><b>Web of People</b><small>A Cardinal project</small></span></a>
    ${series}
    <nav class="nav" aria-label="Main">${NAV.map(([k, l, p]) => `<a href="${esc(href(p))}"${k === current ? ' aria-current="page"' : ''}>${l}</a>`).join('')}</nav>
    <button type="button" class="theme" data-theme-toggle aria-label="Switch between dark and light">Light / Dark</button>
  </div></header>`;
}

export function footerHtml(counts: { people: number; events: number; sources: number; web?: number }): string {
  return `<footer class="foot"><div class="foot-in">
    <p><b>Web of People</b> is a prototype for Cardinal, built to be reused in Dawn.</p>
    <p class="fine">${counts.people} people, ${counts.events} events and ${counts.sources} repository files${counts.web ? ` and ${counts.web} external pages` : ''} as sources. Every fact cites a file in the Cardinal repository or an external page, with a verbatim quote. Where the sources are silent, this site says “not recorded”. Entries marked Draft come from drafting notes that no external source has yet confirmed. Portraits are public-domain or Creative Commons images, almost all from Wikimedia Commons, credited on each profile; where none was found the profile says so.</p>
    <p class="fine"><a href="${esc(href('/sources/'))}">Sources</a> · <a href="${esc(href('/charts/'))}">Charts</a> · <a href="${esc(href('/import/'))}">Import a family file</a></p>
  </div></footer>`;
}

export const THEME_SCRIPT = `try{var t=localStorage.getItem('wop-theme');if(t==='light')document.documentElement.setAttribute('data-theme','light')}catch(e){}`;
