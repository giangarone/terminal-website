import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/terminal-website/',
  build: {
    rolldownOptions: {
      input: {
        home: fileURLToPath(new URL('./index.html', import.meta.url)),
        library: fileURLToPath(new URL('./library/index.html', import.meta.url)),
      },
    },
  },
});
