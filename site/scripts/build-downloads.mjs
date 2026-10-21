import { mkdirSync, readFileSync, statSync, writeFileSync, rmSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Marked } from 'marked';

const site = join(dirname(fileURLToPath(import.meta.url)), '..');
const repo = join(site, '..');
const book = join(repo, 'books/cardinal');
const out = join(site, 'public/downloads');
mkdirSync(out, { recursive: true });
const marked = new Marked({ gfm: true });

function stripFrontmatter(src) {
  if (!src.startsWith('---')) return src;
  const end = src.indexOf('\n---', 3);
  if (end === -1) return src;
  return src.slice(end + 4).replace(/^\n/, '');
}

function quartoToMarkdown(src) {
  const lines = stripFrontmatter(src).split('\n');
  const outLines = [];
  for (const line of lines) {
    if (/^:::\s*\{/.test(line) || line.trim() === ':::') continue;
    outLines.push(line.replace(/\s*\{[#.][^}]*\}\s*$/, ''));
  }
  return outLines.join('\n');
}

async function htmlOf(md) {
  const html = await marked.parse(md);
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br>/gi, '<br/>')
    .replace(/<hr>/gi, '<hr/>')
    .replace(/<img([^>]*[^/])>/gi, '<img$1/>');
}

function bookFiles() {
  const yml = readFileSync(join(book, '_quarto.yml'), 'utf8');
  const files = [];
  for (const line of yml.split('\n')) {
    const m = line.match(/^\s*-\s+((?:ch\/)?[A-Za-z0-9._-]+\.qmd)\s*$/);
    if (m) files.push(m[1]);
  }
  return files;
}

const scripts = [
  ['01 The Ledger', 'site/corpus/podcast/ep01-the-ledger.md'],
  ['02 The Toll', 'site/corpus/podcast/ep02-the-toll.md'],
  ['03 The Octopus', 'site/corpus/podcast/ep03-the-octopus.md'],
  ['04 The Boy and the Farm', 'site/corpus/podcast/ep04-the-boy-and-the-farm.md'],
  ['05 The Engineer\'s Century', 'site/corpus/podcast/ep05-the-engineers-century.md'],
  ['06 The Park', 'site/corpus/podcast/ep06-the-park.md'],
  ['07 The Road', 'site/corpus/podcast/ep07-the-road-script.md'],
  ['08 The Open Era', 'site/corpus/podcast/ep08-the-open-era-script.md'],
];

async function chapters(list, quarto) {
  const items = [];
  for (const entry of list) {
    const title = quarto ? entry : entry[0];
    const rel = quarto ? entry : entry[1];
    const abs = quarto ? join(book, rel) : join(repo, rel);
    const raw = readFileSync(abs, 'utf8');
    const md = quarto ? quartoToMarkdown(raw) : stripFrontmatter(raw);
    const heading = (md.match(/^#\s+(.+)$/m) || [null, title])[1].replace(/\*/g, '').trim();
    items.push({ id: `c${items.length + 1}`, title: heading || title, html: await htmlOf(md) });
  }
  return items;
}

function shell(title, author, items) {
  const body = items
    .map((item) => `<section id="${item.id}"><h1>${item.title}</h1>${item.html}</section>`)
    .join('\n');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${title}</title>
<style>
  body { font: 18px Palatino, Georgia, serif; color: #1c0d10; background: #f4ece4; margin: 0; }
  main { max-width: 40rem; margin: 0 auto; padding: 2rem 1.2rem 4rem; }
  h1 { font-family: Georgia, serif; font-weight: 700; letter-spacing: -0.03em; }
  a { color: #8c1515; }
</style></head><body><main>
<header><p>The McAuliffe Codex</p><h1>${title}</h1><p>${author}</p></header>
${body}
</main></body></html>`;
}

function epubXhtml(item) {
  return `<?xml version="1.0" encoding="utf-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" lang="en"><head><title>${item.title.replace(/[&<>]/g, '')}</title></head><body>
<h1>${item.title.replace(/[&<>]/g, (c) => (c === '&' ? '&amp;' : c === '<' ? '&lt;' : '&gt;'))}</h1>
${item.html}
</body></html>`;
}

function opf(title, author, items, id) {
  const manifest = items
    .map((item) => `<item id="${item.id}" href="${item.id}.xhtml" media-type="application/xhtml+xml"/>`)
    .join('');
  const spine = items.map((item) => `<itemref idref="${item.id}"/>`).join('');
  const nav = items.map((item) => `<li><a href="${item.id}.xhtml">${item.title.replace(/[&<>]/g, '')}</a></li>`).join('');
  return {
    opf: `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="uid" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="uid">${id}</dc:identifier>
    <dc:title>${title}</dc:title>
    <dc:creator>${author}</dc:creator>
    <dc:language>en</dc:language>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    ${manifest}
  </manifest>
  <spine>${spine}</spine>
</package>`,
    nav: `<?xml version="1.0" encoding="utf-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="en"><head><title>Contents</title></head>
<body><nav epub:type="toc"><ol>${nav}</ol></nav></body></html>`,
  };
}

async function writeEpub(file, title, author, items, id) {
  const dir = join('/tmp', id);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(join(dir, 'META-INF'), { recursive: true });
  mkdirSync(join(dir, 'OEBPS'), { recursive: true });
  writeFileSync(join(dir, 'mimetype'), 'application/epub+zip');
  writeFileSync(join(dir, 'META-INF/container.xml'), `<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>`);
  const pack = opf(title, author, items, id);
  writeFileSync(join(dir, 'OEBPS/content.opf'), pack.opf);
  writeFileSync(join(dir, 'OEBPS/nav.xhtml'), pack.nav);
  for (const item of items) writeFileSync(join(dir, 'OEBPS', `${item.id}.xhtml`), epubXhtml(item));
  const py = `
import zipfile, os
root = ${JSON.stringify(dir)}
out = ${JSON.stringify(file)}
with zipfile.ZipFile(out, 'w') as z:
    z.write(os.path.join(root, 'mimetype'), 'mimetype', compress_type=zipfile.ZIP_STORED)
    for base, dirs, files in os.walk(root):
        for name in files:
            if name == 'mimetype':
                continue
            full = os.path.join(base, name)
            z.write(full, os.path.relpath(full, root), compress_type=zipfile.ZIP_DEFLATED)
print(out)
`;
  await new Promise((resolve, reject) => {
    const child = spawn('python3', ['-c', py], { stdio: 'inherit' });
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error('zip ' + code))));
  });
}

function printPdf(html, file) {
  const tmp = `/tmp/${file.split('/').pop()}.html`;
  writeFileSync(tmp, html);
  return new Promise((resolve, reject) => {
    const chrome = spawn('google-chrome', [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--no-pdf-header-footer',
      `--print-to-pdf=${file}`,
      `file://${tmp}`,
    ], { stdio: 'ignore' });
    const started = Date.now();
    const timer = setInterval(() => {
      try {
        const stat = statSync(file);
        if (stat.size > 2000 && Date.now() - stat.mtimeMs > 2000) {
          clearInterval(timer);
          chrome.kill();
          resolve();
        }
      } catch {
        /* not written yet */
      }
      if (Date.now() - started > 180000) {
        clearInterval(timer);
        chrome.kill();
        reject(new Error('pdf timeout ' + file));
      }
    }, 500);
  });
}

const only = process.argv[2];
const author = 'Kyle McAuliffe';
if (only !== 'scripts') {
  const bookItems = await chapters(bookFiles(), true);
  await writeEpub(join(out, 'cardinal-draft.epub'), 'Cardinal', author, bookItems, 'cardinal-draft');
  await printPdf(shell('Cardinal', author, bookItems), join(out, 'cardinal-draft.pdf'));
  console.log('book', bookItems.length);
}
if (only !== 'book') {
  const scriptItems = await chapters(scripts, false);
  await writeEpub(join(out, 'cardinal-scripts.epub'), 'Cardinal episode scripts', author, scriptItems, 'cardinal-scripts');
  await printPdf(shell('Cardinal episode scripts', author, scriptItems), join(out, 'cardinal-scripts.pdf'));
  console.log('scripts', scriptItems.length);
}
