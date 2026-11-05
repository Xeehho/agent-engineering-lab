import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  server: { port: 5173, strictPort: true, proxy: { '/api': 'http://127.0.0.1:8787' } },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        home: fileURLToPath(new URL('./index.html', import.meta.url)),
        lab: fileURLToPath(new URL('./lab.html', import.meta.url)),
      },
    },
  },
});
