import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';
import { cpSync, existsSync } from 'fs';

// Custom plugin to copy manifest and public files to dist
function copyManifestPlugin() {
  return {
    name: 'copy-manifest',
    closeBundle() {
      cpSync('public/manifest.json', 'dist/manifest.json');
      if (existsSync('public/icons')) {
        cpSync('public/icons', 'dist/icons', { recursive: true });
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), copyManifestPlugin()],
  base: '',
  build: {
    rollupOptions: {
      input: {
        sidepanel: resolve(__dirname, 'src/sidepanel/sidepanel.html'),
        options: resolve(__dirname, 'src/options/options.html'),
        background: resolve(__dirname, 'src/background/background.js'),
        content: resolve(__dirname, 'src/content/content.js'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          // Keep background and content scripts at root level
          if (chunkInfo.name === 'background' || chunkInfo.name === 'content') {
            return '[name].js';
          }
          return 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
});
