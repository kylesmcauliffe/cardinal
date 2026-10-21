import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public/places');
mkdirSync(outDir, { recursive: true });

const places = [
  { id: 'honolulu', name: '2365 Kalākaua Avenue, Honolulu', q: 'Moana Hotel Waikiki', need: [/moana/i, /kal[aā]kaua/i] },
  { id: 'coloma', name: 'Coloma, CA', q: 'Sutter Mill Coloma California', need: [/coloma/i] },
  { id: 'florence', name: 'Florence, Italy', q: 'Florence Italy Duomo', need: [/florence/i, /firenze/i] },
  { id: 'geneva', name: 'Geneva', q: 'Geneva Switzerland Jet d Eau', need: [/gen[eè]ve/i, /geneva, switzerland/i, /jet d/i] },
  { id: 'guadalupe', name: 'Guadalupe Hidalgo', q: 'Villa de Guadalupe Hidalgo', need: [/guadalupe hidalgo/i, /villa de guadalupe/i] },
  { id: 'hongkong', name: 'Hong Kong', q: 'Hong Kong skyline Victoria Harbour', need: [/hong kong/i] },
  { id: 'kobe', name: 'Kobe, Japan', q: 'Kobe Japan port', need: [/kobe/i] },
  { id: 'menlo', name: 'Menlo Park, CA', q: 'Menlo Park California', need: [/menlo park/i] },
  { id: 'mexicocity', name: 'Mexico City', q: 'Mexico City Zocalo', need: [/mexico city/i, /ciudad de m[eé]xico/i, /z[oó]calo/i] },
  { id: 'monterey', name: 'Monterey, CA', q: 'Monterey California Colton Hall', need: [/colton hall/i, /monterey, california/i, /monterey bay/i] },
  { id: 'mountainview', name: 'Mountain View, CA', q: 'Mountain View California', need: [/mountain view/i] },
  { id: 'pagemill', name: 'Page Mill Road, Palo Alto, CA', q: 'Page Mill Road Palo Alto', need: [/page mill/i] },
  { id: 'paloalto', name: 'Palo Alto, CA', q: 'Palo Alto California', need: [/palo alto/i] },
  { id: 'promontory', name: 'Promontory Summit, UT', q: 'Promontory Summit golden spike', need: [/promontory/i] },
  { id: 'sacramento', name: 'Sacramento, CA', q: 'Sacramento California capitol', need: [/sacramento/i] },
  { id: 'sandiego', name: 'San Diego, CA', q: 'San Diego California', need: [/san diego/i] },
  { id: 'sanfrancisco', name: 'San Francisco, CA', q: 'San Francisco California', need: [/san francisco/i] },
  { id: 'sanjose', name: 'San Jose, CA', q: 'San Jose California downtown', need: [/san jos[eé], california/i, /downtown san jos/i] },
  { id: 'seattle', name: 'Seattle, WA', q: 'Seattle Washington skyline', need: [/seattle/i] },
  { id: 'stanford', name: 'Stanford, CA', q: 'Stanford University Main Quad', need: [/stanford university/i, /main quad/i, /memorial church/i] },
  { id: 'sunnyvale', name: 'Sunnyvale, CA', q: 'Sunnyvale California', need: [/sunnyvale/i] },
  { id: 'washington', name: 'Washington, DC', q: 'United States Capitol Washington', need: [/capitol/i, /washington, d\.?c/i, /national mall/i] },
];

const UA = 'CardinalSite/1.0 (cardinal reading room; commons photo match)';

function freeLicense(meta) {
  const blob = [meta.LicenseShortName?.value, meta.UsageTerms?.value, meta.License?.value]
    .filter(Boolean)
    .join(' ');
  if (/non-?commercial|\bnc\b|no ?deriv|\bnd\b|all rights reserved|fair use|copyrighted/i.test(blob)) return '';
  if (/no evidence of permission|unfree|copyrighted work/i.test(blob)) return '';
  if (/public domain|cc0|cc[- ]by(?!-nc)/i.test(blob)) return meta.LicenseShortName?.value || blob.slice(0, 80);
  return '';
}

function authorOf(meta) {
  let a = strip(meta.Artist?.value || meta.Credit?.value || '');
  const created = a.match(/created by\s+([^.]{2,60})/i);
  if (created) a = created[1].trim();
  if (/no evidence of permission|checkusage|lizenzhinweisgenerator/i.test(a)) return '';
  if (a.length > 90) a = a.slice(0, 90).replace(/\s+\S*$/, '');
  return a;
}

function strip(html) {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

async function commons(params) {
  const url = new URL('https://commons.wikimedia.org/w/api.php');
  url.searchParams.set('format', 'json');
  url.searchParams.set('origin', '*');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Api-User-Agent': UA } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

async function candidates(place) {
  const data = await commons({
    action: 'query',
    generator: 'search',
    gsrsearch: `${place.q} filetype:bitmap`,
    gsrnamespace: '6',
    gsrlimit: '12',
    prop: 'imageinfo|categories',
    iiprop: 'url|extmetadata|mime|size',
    iiurlwidth: '1200',
    cllimit: '30',
    clshow: '!hidden',
  });
  return Object.values(data.query?.pages || {});
}

function rejectReason(page, place) {
  const title = String(page.title || '').replace(/^File:/, '');
  const info = page.imageinfo?.[0];
  if (!info) return 'no image info';
  if (!/^image\/(jpeg|png|webp)$/.test(info.mime || '')) return `mime ${info.mime}`;
  const license = freeLicense(info.extmetadata || {});
  if (!license) return 'license not freely reusable';
  const cats = (page.categories || []).map((c) => c.title).join(' | ');
  if (/portrait|people of|births|deaths|person\b/i.test(`${title} ${cats}`) && !place.need.some((re) => re.test(title))) {
    return 'looks like a person';
  }
  if (/portrait photographs/i.test(cats)) return 'portrait category';
  if (/no evidence of permission/i.test(strip(info.extmetadata?.Artist?.value || ''))) return 'license metadata is not a clear grant';
  if (!place.need.some((re) => re.test(`${title} ${cats}`))) return 'title does not name the place';
  if (/map of the world|locator map|flag of/i.test(title) && !/promontory|page mill|moana|colton/i.test(title)) {
    return 'locator or flag, not the place';
  }
  return '';
}

const prior = existsSync(join(root, 'src/data/places-photos.json'))
  ? JSON.parse(readFileSync(join(root, 'src/data/places-photos.json'), 'utf8'))
  : [];
const kept = new Map(prior.filter((row) => row.file).map((row) => [row.name, row]));
const manifest = [];
for (const place of places) {
  if (kept.has(place.name) && place.id !== 'guadalupe') {
    manifest.push(kept.get(place.name));
    console.log('HAVE', place.name);
    continue;
  }
  await new Promise((r) => setTimeout(r, 6500));
  let pages = [];
  try {
    pages = await candidates(place);
  } catch (error) {
    manifest.push({ name: place.name, skipped: String(error.message || error) });
    console.log('SKIP', place.name, error.message);
    continue;
  }
  const hit = pages.find((page) => !rejectReason(page, place));
  if (!hit) {
    const why = pages.slice(0, 3).map((page) => `${page.title}: ${rejectReason(page, place)}`).join(' || ');
    manifest.push({ name: place.name, skipped: why || 'no search hits' });
    console.log('SKIP', place.name, why);
    continue;
  }
  const info = hit.imageinfo[0];
  const meta = info.extmetadata || {};
  const file = `${place.id}.jpg`;
  const src = info.thumburl || info.url;
  const img = await fetch(src, { headers: { 'User-Agent': UA } });
  if (!img.ok) {
    manifest.push({ name: place.name, skipped: `download ${img.status}` });
    console.log('SKIP', place.name, 'download', img.status);
    continue;
  }
  writeFileSync(join(outDir, file), Buffer.from(await img.arrayBuffer()));
  const record = {
    name: place.name,
    file: `/places/${file}`,
    title: hit.title.replace(/^File:/, ''),
    page: `https://commons.wikimedia.org/wiki/${encodeURIComponent(hit.title.replace(/ /g, '_'))}`,
    author: authorOf(meta),
    license: meta.LicenseShortName?.value || '',
    licenseUrl: meta.LicenseUrl?.value || '',
    sourceUrl: info.descriptionurl || info.url,
  };
  manifest.push(record);
  console.log('KEEP', place.name, '->', record.title, record.license);
  await new Promise((r) => setTimeout(r, 200));
}

writeFileSync(join(root, 'src/data/places-photos.json'), JSON.stringify(manifest, null, 2));
console.log('wrote', manifest.filter((m) => m.file).length, 'photos');
