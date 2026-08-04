import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// The production build is served from a GitHub Pages project subpath, so asset
// URLs need that prefix. Dev keeps serving from the root.
// Change REPO_BASE if you rename the repository.
const REPO_BASE = '/ADHD-Care-Hub/';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? REPO_BASE : '/',
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  server: { port: 5173 },
}));
