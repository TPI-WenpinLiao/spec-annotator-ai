import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.PUBLIC_PATH || '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  }
});
