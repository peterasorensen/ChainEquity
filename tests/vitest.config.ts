import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 60000,
    hookTimeout: 30000,
    teardownTimeout: 10000,
    isolate: false,
    threads: false,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true
      }
    }
  }
});
