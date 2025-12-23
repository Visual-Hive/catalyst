/**
 * @file vite.config.ts
 * @description Vite configuration for Electron + React application
 * 
 * Configures:
 * - React plugin for JSX/TSX support and HMR
 * - Electron main process build
 * - Electron preload script build
 * - Path aliases for clean imports
 * 
 * @architecture Phase 1, Task 1.1 - Electron Application Shell
 * @created 2025-11-19
 * @author AI (Cline) + Human Review
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import electronRenderer from 'vite-plugin-electron-renderer';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // React plugin for HMR and JSX transformation
    react(),
    
    // Electron main process and preload script
    electron([
      {
        // Main process entry point
        entry: 'electron/main.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['electron', 'keytar', 'vite', 'esbuild', 'rollup', 'fsevents', 'better-sqlite3'],
            },
          },
          resolve: {
            // Force .ts extension resolution for src/main imports
            extensions: ['.ts', '.js', '.mjs', '.json'],
            alias: {
              '@main': path.resolve(__dirname, './src/main'),
            },
          },
        },
      },
      {
        // Preload script for secure IPC
        entry: 'electron/preload.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
          },
        },
      },
    ]),
    
    // Electron renderer process support
    electronRenderer(),
  ],
  
  // Path resolution
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/renderer'),
      '@core': path.resolve(__dirname, './src/core'),
    },
  },
  
  // Build configuration
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
    },
  },
  
  // Dev server configuration
  server: {
    port: 5173,
    strictPort: true,
  },
  
  // Base URL for assets
  base: './',
});
