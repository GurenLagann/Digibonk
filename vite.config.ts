import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  build: { target: 'es2022' },
  // dev em http://digibonk.local:5173 (linha "127.0.0.1 digibonk.local" no /etc/hosts); localhost continua valendo
  server: { host: '127.0.0.1', allowedHosts: ['digibonk.local'] },
  test: { include: ['tests/**/*.test.ts'], globals: true, environment: 'node' },
});
