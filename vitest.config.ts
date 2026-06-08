import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/client/**/*.test.ts', 'tests/client/**/*.test.tsx']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.')
    }
  }
})
