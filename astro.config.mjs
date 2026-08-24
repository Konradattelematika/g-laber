import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://g-laber.de',
  trailingSlash: 'never',
  build: { inlineStylesheets: 'auto' },
});
