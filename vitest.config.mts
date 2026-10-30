import { defineConfig } from 'vitest/config'
import path from 'path'
import { fileURLToPath } from 'url'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['node_modules/**', '.agents/**', '.claude/**', 'tests/e2e/**'],
    fileParallelism: false,
  },
  resolve: {
    alias: {
      '@': rootDir,
    },
  },
})
