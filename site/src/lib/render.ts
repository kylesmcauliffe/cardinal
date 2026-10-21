import { Marked } from 'marked';

const marked = new Marked({ gfm: true });

export function stripFrontmatter(src: string): string {
  if (!src.startsWith('---')) return src;
  const end = src.indexOf('\n---', 3);
  if (end === -1) return src;
  return src.slice(end + 4).replace(/^\n/, '');
}

export function quartoToMarkdown(src: string): string {
  const lines = stripFrontmatter(src).split('\n');
  const out: string[] = [];
  const stack: string[] = [];
  for (const line of lines) {
    const open = line.match(/^:::\s*\{\.([^}]+)\}\s*$/);
    if (open) {
      const cls = open[1].split(/\s+/)[0].replace(/[^a-z0-9_-]/gi, '');
      stack.push(cls);
      out.push(`<section class="q ${cls}">`);
      continue;
    }
    if (line.trim() === ':::' && stack.length) {
      stack.pop();
      out.push('</section>');
      continue;
    }
    const cleaned = /^#{1,6}\s/.test(line) ? line.replace(/\s*\{[^}]+\}\s*$/, '') : line.replace(/\s*\{#[^}]+\}\s*$/, '');
    out.push(cleaned);
  }
  return out.join('\n');
}

export function toPlain(src: string): string {
  return src
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~\[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function firstHeading(src: string): string {
  const body = stripFrontmatter(src);
  const m = body.match(/^#\s+(.+)$/m);
  if (!m) return '';
  return m[1].replace(/\s*\{[^}]+\}\s*$/, '').replace(/\*/g, '').trim();
}

export function chapterMeta(src: string): string {
  const m = src.match(/::: \{\.chapter-meta\}\n([\s\S]*?)\n:::/);
  return m ? m[1].replace(/\s+/g, ' ').trim() : '';
}

export async function renderMarkdown(src: string, quarto = false): Promise<string> {
  const md = quarto ? quartoToMarkdown(src) : stripFrontmatter(src);
  const html = await marked.parse(md);
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<h1\b/g, '<h2')
    .replace(/<\/h1>/g, '</h2>');
}

export function field(block: string, name: string): string {
  const re = new RegExp(`\\*\\*${name}:\\*\\*\\s*(.+)`);
  const m = block.match(re);
  return m ? m[1].trim() : '';
}
