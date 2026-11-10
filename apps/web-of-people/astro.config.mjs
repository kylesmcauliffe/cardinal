import { defineConfig } from 'astro/config';

const base = process.env.WOP_BASE || '/';

export default defineConfig({
  output: 'static',
  base,
  trailingSlash: 'always',
  build: { format: 'directory' },
  devToolbar: { enabled: false },
});
