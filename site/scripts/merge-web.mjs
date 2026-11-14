import { cpSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const site = join(dirname(fileURLToPath(import.meta.url)), '..');
const from = join(site, '..', 'apps', 'web-of-people', 'dist');
const to = join(site, 'dist', 'web');

if (!existsSync(from)) {
  throw new Error(`Web of People build not found at ${from}`);
}

cpSync(from, to, { recursive: true });
console.log('Copied Web of People into site/dist/web');
