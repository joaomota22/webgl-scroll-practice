import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  {
    // O React Three Fiber usa props próprias (args, position, attach…) que esta regra desconhece.
    files: ['components/three/**'],
    rules: { 'react/no-unknown-property': 'off' },
  },
  globalIgnores(['.next/**', 'next-env.d.ts']),
]);
