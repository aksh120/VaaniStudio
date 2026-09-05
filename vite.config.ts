import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import path from 'node:path'

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: path.join(__dirname, 'src/main/index.ts'),
        vite: {
          build: {
            outDir: path.join(__dirname, 'dist-electron/main'),
            rollupOptions: {
              external: ['electron', 'node:path', 'node:fs', 'node:child_process', 'node:os'],
            },
          },
        },
      },
      {
        entry: path.join(__dirname, 'src/preload/index.ts'),
        onstart(options) {
          options.reload()
        },
        vite: {
          build: {
            outDir: path.join(__dirname, 'dist-electron/preload'),
            rollupOptions: {
              external: ['electron'],
            },
          },
        },
      },
    ]),
    renderer(),
  ],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@renderer': path.resolve(__dirname, 'src/renderer/src'),
      '@main': path.resolve(__dirname, 'src/main'),
      '@preload': path.resolve(__dirname, 'src/preload'),
    },
  },
  root: path.join(__dirname, 'src/renderer'),
  build: {
    outDir: path.join(__dirname, 'dist'),
    emptyOutDir: true,
  },
})
