import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import apiHandler from './server/handler.js';

// Serve the same /api routes locally that Vercel serves in production,
// so `npm run dev` is the only command needed.
const marketApi = () => ({
  name: 'wealthify-market-api',
  configureServer(server) {
    server.middlewares.use('/api', (req, res) => apiHandler(req, res));
  },
  configurePreviewServer(server) {
    server.middlewares.use('/api', (req, res) => apiHandler(req, res));
  },
});

export default defineConfig({
  plugins: [react(), marketApi()],
  server: { port: 3000 },
  build: {
    rollupOptions: {
      output: {
        manualChunks: { charts: ['recharts'], motion: ['framer-motion'] },
      },
    },
  },
});
