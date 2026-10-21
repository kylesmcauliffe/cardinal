import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://cardinal-510519.web.app',
  trailingSlash: 'never',
  build: {
    format: 'directory',
  },
});
