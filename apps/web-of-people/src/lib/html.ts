import type { Cite, Person, Status } from './types';
import { initials } from './data';

export function esc(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

function baseUrl(): string {
  // Vite inlines import.meta.env in the Astro build and in the browser bundle; plain Node (tsx) has none.
  // @ts-ignore
  const env = typeof import.meta.env !== 'undefined' ? import.meta.env : undefined;
  return String(env?.BASE_URL ?? '/').replace(/\/$/, '');
}

let resolver: (path: string) => string = (path) => baseUrl() + (path.startsWith('/') ? path : '/' + path);

export function setLinkResolver(fn: (path: string) => string) {
  resolver = fn;
}

export function href(path: string): string {
  return resolver(path);
}

export const STATUS_LABEL: Record<Status, string> = {
  VERIFIED: 'Verified',
  'NEEDS SOURCE': 'Needs source',
  CONTESTED: 'Contested',
  DRAFT: 'Draft note',
  IMPORTED: 'As imported',
};

export const STATUS_CLASS: Record<Status, string> = {
  VERIFIED: 'verified',
  'NEEDS SOURCE': 'needs',
  CONTESTED: 'contested',
  DRAFT: 'draft',
  IMPORTED: 'draft',
};

export function statusBadge(s: Status): string {
  return `<span class="status ${STATUS_CLASS[s]}">${STATUS_LABEL[s]}</span>`;
}

const REPO_BASE = 'https://github.com/kylesmcauliffe/cardinal/blob/main/';

const KIND_LABEL: Record<string, string> = {
  primary: 'primary source',
  reference: 'reference work',
  scholarly: 'scholarly work',
  institutional: 'institutional page',
  tertiary: 'encyclopedia (tertiary)',
};

export function citeHtml(c: Cite): string {
  if (c.url) {
    const label = [c.title, c.publisher].filter(Boolean).join(' · ') || c.url;
    return `<span class="cite web"><a href="${esc(c.url)}" rel="noopener">${esc(label)}</a>${c.kind ? ` <span class="kind">${esc(KIND_LABEL[c.kind] ?? c.kind)}</span>` : ''} <q>${esc(c.q)}</q></span>`;
  }
  const f = c.f ?? '';
  if (f.startsWith('import:')) {
    return `<span class="cite">${esc(f.slice(7))}${c.line ? ` line ${c.line}` : ''} <q>${esc(c.q)}</q></span>`;
  }
  const url = REPO_BASE + f.split('/').map(encodeURIComponent).join('/') + (c.line ? `#L${c.line}` : '');
  const where = f + (c.line ? `:${c.line}` : '');
  return `<span class="cite"><a href="${esc(url)}" rel="noopener">${esc(where)}</a> <q>${esc(c.q)}</q></span>`;
}

export function portraitSrc(p: Person): string | null {
  return p.portrait ? href('/' + p.portrait.file) : null;
}

export function avatarHtml(p: Person, cls: 'portrait' | 'mini' = 'portrait'): string {
  const src = portraitSrc(p);
  const inner = src
    ? `<img src="${esc(src)}" alt="${cls === 'portrait' ? 'Portrait of ' + esc(p.name) : ''}" width="${cls === 'portrait' ? 192 : 72}" height="${cls === 'portrait' ? 192 : 72}" loading="lazy">`
    : cls === 'portrait'
      ? `<span class="init" aria-hidden="true">${esc(initials(p.name))}</span>`
      : esc(initials(p.name));
  return `<span class="${cls}${src ? '' : ' none'}"${src ? '' : ' aria-hidden="true"'}>${inner}</span>`;
}

export function personPill(p: Person): string {
  return `<li><a href="${esc(href('/people/' + p.id + '/'))}" data-person="${esc(p.id)}">${avatarHtml(p, 'mini')}${esc(p.short ?? p.name)}</a></li>`;
}
