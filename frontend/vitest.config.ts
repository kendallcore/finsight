import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// React's production build omits `act`, which testing-library needs to drive renders.
// A developer shell may well have NODE_ENV=production exported (this repo's does), so the
// test run pins it here as well as in the npm scripts.
if (!process.env.NODE_ENV || process.env.NODE_ENV === 'production') {
  process.env.NODE_ENV = 'test';
}

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
    // Recharts and Plotly only render into sized containers; give jsdom a viewport.
    restoreMocks: true
  }
});
