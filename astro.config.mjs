// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';

// Este archivo se evalúa antes de que Vite cargue el .env, por eso se lee explícitamente.
const { BACKEND_URL } = loadEnv(process.env.NODE_ENV ?? 'development', process.cwd(), '');

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  server: {
    host: true
  },
  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: ['printless-patentably-india.ngrok-free.dev', 'jesstherapy.cloud', 'www.jesstherapy.cloud'],
      proxy: {
        '/api': {
          target: BACKEND_URL || 'http://localhost:3010',
          changeOrigin: true,
          secure: false,
        }
      }
    }
  }
});
