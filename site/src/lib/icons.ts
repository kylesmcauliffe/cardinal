import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const iconDir = join(dirname(require.resolve('lucide-static/package.json')), 'icons');

const cache = new Map<string, string>();

export function iconInner(name: string): string {
  const hit = cache.get(name);
  if (hit) return hit;
  const svg = readFileSync(join(iconDir, `${name}.svg`), 'utf8');
  const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  cache.set(name, inner);
  return inner;
}
