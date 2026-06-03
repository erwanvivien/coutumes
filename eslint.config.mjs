import json from '@eslint/json';
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import { defineConfig, globalIgnores } from 'eslint/config';
import { readFileSync } from 'fs';
import globals from 'globals';
import { dirname, join } from 'path';
import tseslint from 'typescript-eslint';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const eslintConfig = [
  globalIgnores([
    'prisma/generated',
    'scripts/cache',
    'package-lock.json',
    'loadTesting.js',
    'eslint.config.mjs',
  ]),
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx,mts,cts}'],
    extends: [tseslint.configs.recommendedTypeChecked],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx,mts,cts}'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-unused-vars': 'off',
    },
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx,mts,cts}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.commonjs,
      },
      parserOptions: {
        projectService: true,
      },
    },
  },
  { files: ['**/*.json'], plugins: { json }, language: 'json/json', extends: ['json/recommended'] },
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx,mts,cts}'],
    rules: {
      'no-console': ['error', { allow: ['info', 'warn', 'error'] }],
      eqeqeq: ['error', 'always'],
      'one-var': ['error', 'never'],
      semi: ['error', 'always'],
      'no-throw-literal': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-unused-vars': 'off',
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-nested-ternary': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      curly: ['error', 'all'],
      'no-implicit-coercion': ['error', {}],
    },
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx,mts,cts}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@prisma/client',
              message: 'Use @/prisma/generated',
            },
            {
              name: 'zod',
              importNames: ['boolean'],
              message: "Please use booleanSchema from '@/lib/types/schemas/utils' instead.",
            },
            {
              name: 'zod',
              importNames: ['date'],
              message: 'Please use coerce',
            },
            ...preventPrismaImports(),
          ],
        },
      ],
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
        // Ban z.uuid() or z.string().uuid()
        {
          selector:
            'CallExpression[callee.object.callee.object.name="z"][callee.object.callee.property.name="string"][callee.property.name="uuid"]',
          message: 'Use uuidSchema from "@/lib/types/schemas/utils" instead of z.string().uuid()',
        },
        {
          selector: 'CallExpression[callee.object.name="z"][callee.property.name="uuid"]',
          message: 'Use uuidSchema from "@/lib/types/schemas/utils" instead of z.uuid()',
        },

        // Ban z.date() or z.coerce.date()
        {
          selector:
            'CallExpression[callee.object.object.name="z"][callee.object.property.name="coerce"][callee.property.name="date"]',
          message: 'Use dateSchema from "@/lib/types/schemas/utils" instead of z.coerce.date()',
        },
        {
          selector: 'CallExpression[callee.object.name="z"][callee.property.name="date"]',
          message: 'Use dateSchema from "@/lib/types/schemas/utils" instead of z.date()',
        },
      ],
    },
  },
];

export default defineConfig(eslintConfig);

/**
 * @return {{
 *   name: string;
 *   message: string;
 *   importNames: string[];
 * }[]}
 */
function preventPrismaImports() {
  const prismaSchemaFile = join(__dirname, 'prisma', 'schema.prisma');
  const prismaSchemaContent = readFileSync(prismaSchemaFile, 'utf-8');

  return prismaSchemaContent
    .split('\n')
    .map((line) => {
      if (line.startsWith('model ')) {
        const modelName = line.split(' ')[1].trim();
        return {
          name: '@/prisma/generated',
          importNames: [modelName],
          message: `Use schema instead of prisma type`,
        };
      }
      if (line.startsWith('enum ')) {
        const enumName = line.split(' ')[1].trim();
        return {
          name: '@/prisma/generated',
          importNames: [enumName],
          message: `Use schema instead of prisma enum type`,
        };
      }

      return undefined;
    })
    .filter((item) => item !== undefined);
}
