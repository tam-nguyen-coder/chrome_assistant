import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';
import { cpSync, existsSync, readFileSync, writeFileSync } from 'fs';

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

// Plugin to inline content script dependencies
function inlineContentDeps() {
  return {
    name: 'inline-content-deps',
    enforce: 'post',
    generateBundle(options, bundle) {
      // Find the content script chunk
      const contentChunk = bundle['content.js'];
      if (!contentChunk || contentChunk.type !== 'chunk') return;

      // Get all the imports from content.js and inline them
      const imports = contentChunk.imports || [];
      let code = contentChunk.code;

      // Replace imports with inlined code
      for (const importName of imports) {
        const depChunk = bundle[importName];
        if (depChunk && depChunk.type === 'chunk') {
          // Prepend the dependency code
          code = depChunk.code + '\n' + code;
          // Remove the import statement
          code = code.replace(new RegExp(`import.*from.*['"]\\.\\./${importName}['"].*;?`, 'g'), '');
          // Remove the chunk from bundle
          delete bundle[importName];
        }
      }

      // Remove import statements
      code = code.replace(/import\s*\{[^}]*\}\s*from\s*['"][^'"]+['"]\s*;?/g, '');
      code = code.replace(/import\s+[^;]+\s*from\s*['"][^'"]+['"]\s*;?/g, '');

      contentChunk.code = code;
      contentChunk.imports = [];
    }
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), copyManifestPlugin()],
  base: '',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        sidepanel: resolve(__dirname, 'src/sidepanel/sidepanel.html'),
        options: resolve(__dirname, 'src/options/options.html'),
        background: resolve(__dirname, 'src/background/background.ts'),
        content: resolve(__dirname, 'src/content/content.ts'),
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