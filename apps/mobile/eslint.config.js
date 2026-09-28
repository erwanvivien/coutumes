// https://docs.expo.dev/guides/using-eslint/
const json = require('@eslint/json').default;
const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const globals = require('globals');
const tseslint = require('typescript-eslint');

// eslint-config-expo ships several sub-configs without a `files` restriction,
// which otherwise bleed JS/React rules into non-JS files (e.g. our JSON configs below).
const scopedExpoConfig = expoConfig.map((config) =>
  config.files || config.ignores ? config : { ...config, files: ['**/*.{js,jsx,ts,tsx,mjs,cjs}'] },
);

module.exports = defineConfig([
  globalIgnores(['dist/*', 'package-lock.json']),
  scopedExpoConfig,
  {
    files: ['**/*.{ts,tsx}'],
    extends: [tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
  },
  { files: ['**/*.json'], plugins: { json }, language: 'json/json', extends: ['json/recommended'] },
  // Node-run tooling scripts (fastlane helpers, etc.), not app source — they run under plain
  // Node, not the RN/browser environment the rest of this config assumes.
  { files: ['scripts/**/*.js'], languageOptions: { globals: globals.node } },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      'no-console': ['error', { allow: ['info', 'warn', 'error'] }],
      eqeqeq: ['error', 'always'],
      'one-var': ['error', 'never'],
      semi: ['error', 'always'],
      'no-throw-literal': 'error',
      'no-nested-ternary': 'error',
      curly: ['error', 'all'],
      'no-implicit-coercion': ['error', {}],
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSEnumDeclaration',
          message: "Don't use enums, use union types instead",
        },
        {
          selector: 'TSInterfaceDeclaration',
          message: "Don't use interfaces, use type aliases instead",
        },
      ],
    },
  },
  {
    settings: {
      react: { version: '19' }, // Avoids auto-detection crash
    },
  },
]);
