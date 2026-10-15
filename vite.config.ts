/// <reference types="vitest/config" />
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ command, mode }) => {
  if (command === 'build' && mode === 'production' && !loadEnv(mode, process.cwd()).VITE_API_URL) {
    throw new Error('VITE_API_URL es obligatoria para el build de producción')
  }
  return {
    plugins: [
      tanstackRouter({ target: 'react', autoCodeSplitting: true }),
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
    server: {
      port: 5173,
      strictPort: true,
    },
    test: {
      include: ['src/**/*.test.ts'],
      env: {
        TZ: 'Asia/Tokyo',
      },
    },
  }
})
