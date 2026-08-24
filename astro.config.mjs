import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://g-laber.com',
  trailingSlash: 'never',
  build: { inlineStylesheets: 'auto' },
});
