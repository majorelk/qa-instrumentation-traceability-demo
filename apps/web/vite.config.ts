import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/telemetry': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/debug': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/telemetry': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/debug': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});