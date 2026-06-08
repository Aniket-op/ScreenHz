// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://screenhz.app',
  output: 'static',
  integrations: [sitemap(), react()],
  vite: {
    build: {
      cssCodeSplit: true,
    },

    plugins: [tailwindcss()]
  }
});