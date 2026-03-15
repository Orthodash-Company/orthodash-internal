import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'

export default defineConfig([
  ...nextVitals,
  {
    rules: {
      'react-hooks/exhaustive-deps': 'off',
      'react/no-unescaped-entities': 'off',
      '@next/next/no-img-element': 'off',
      '@next/next/no-html-link-for-pages': 'off',
      'prefer-const': 'off',
    },
  },
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
])
