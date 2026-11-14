import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const site = join(dirname(fileURLToPath(import.meta.url)), '..');
const wop = join(site, '..', 'apps', 'web-of-people');

const install = spawnSync('npm', ['ci', '--no-audit', '--no-fund'], {
  cwd: wop,
  stdio: 'inherit',
});
if (install.status !== 0) process.exit(install.status ?? 1);

const build = spawnSync('npm', ['run', 'build'], {
  cwd: wop,
  stdio: 'inherit',
  env: { ...process.env, WOP_BASE: '/web/' },
});
if (build.status !== 0) process.exit(build.status ?? 1);
