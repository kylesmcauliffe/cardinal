#!/usr/bin/env node
/**
 * The episode player must not point at a file that does not exist.
 * Run from the site directory: node scripts/check-audio-manifest.mjs
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const site = join(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(join(site, 'src/data/audio-manifest.json'), 'utf8'));
const errors = [];

if (!Array.isArray(manifest.episodes) || manifest.episodes.length !== 8) {
  errors.push('manifest must list episodes 1 through 8');
}

for (const row of manifest.episodes ?? []) {
  if (row.src == null) continue;
  if (typeof row.src !== 'string' || row.src.length === 0) {
    errors.push(`episode ${row.n}: src must be a URL or null`);
    continue;
  }
  if (row.src.startsWith('/')) {
    const file = join(site, 'public', row.src);
    if (!existsSync(file)) errors.push(`episode ${row.n}: ${row.src} is not in site/public`);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('ok: audio manifest has no missing local files');
