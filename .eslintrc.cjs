// .cjs, not .js: package.json declares "type": "module", so a .eslintrc.js using
// module.exports fails to load ("module is not defined") and `pnpm run lint`
// could not run at all.
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    // NOTE: Removed 'recommended-requiring-type-checking' - too strict for Chrome extensions
  ],
  env: {
    browser: true,
    webextensions: true,
    es6: true,
    node: true,
  },
  rules: {
    // TypeScript specific
    '@typescript-eslint/no-explicit-any': 'warn', // Keep as warning
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

    // Relax strict type checking for Chrome extension APIs
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unsafe-argument': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',

    // Allow floating promises (common in event handlers)
    '@typescript-eslint/no-floating-promises': 'off',
    '@typescript-eslint/no-misused-promises': 'off',

    // Allow async functions without await (sometimes needed for interface consistency)
    '@typescript-eslint/require-await': 'warn',

    // General
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'prefer-const': 'error',
    'no-var': 'error',

    // Relax rules that conflict with common patterns
    'no-useless-escape': 'warn', // Many regex patterns trigger false positives
    'no-async-promise-executor': 'warn', // Sometimes needed for complex async initialization
    'no-case-declarations': 'off', // TypeScript scoping makes this safe
    '@typescript-eslint/no-var-requires': 'warn', // Dynamic requires sometimes needed
    '@typescript-eslint/ban-ts-comment': [
      'warn',
      {
        'ts-ignore': 'allow-with-description',
        'ts-expect-error': 'allow-with-description',
        minimumDescriptionLength: 3,
      },
    ],
    '@typescript-eslint/no-this-alias': 'off', // Sometimes needed for event handlers
    'no-duplicate-case': 'error', // Keep this as error - it's a real bug
  },
  ignorePatterns: ['node_modules/', 'extension/', 'dist/', 'build/', 'scripts/'],
};
