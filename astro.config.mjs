// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  server: {
    host: true
  },
  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: ['printless-patentably-india.ngrok-free.dev'],
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
        }
      }
    }
  }
});