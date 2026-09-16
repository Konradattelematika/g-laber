import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://g-laber.com',
  trailingSlash: 'never',
  // Gesamtes CSS liegt bei ~8 KB — inline schlägt zwei extra Requests.
  build: { inlineStylesheets: 'always' },
});
