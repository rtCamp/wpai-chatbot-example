import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import importResolver from 'eslint-plugin-import';
import { FlatCompat } from '@eslint/eslintrc';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
	baseDirectory: __dirname,
});

export default [
	// Base JavaScript config
	js.configs.recommended,

	// Global ignores
	{
		ignores: [
			'**/node_modules/**',
			'**/dist/**',
			'**/build/**',
			'**/.next/**',
			'**/coverage/**',
			'**/.turbo/**',
			'**/vendor/**',
			'**/public/**',
			'**/*.min.js',
			'**/firecrawl/**',
			'**/wordpress/**', // As per the discussion, we will have separate eslint config for WordPress
			'**/.eslintrc.js',
			'**/eslint.config.*',
		],
	},

	// TypeScript files configuration
	{
		files: ['**/*.ts', '**/*.tsx'],
		languageOptions: {
			parser: typescriptParser,
			parserOptions: {
				ecmaVersion: 'latest',
				sourceType: 'module',
				ecmaFeatures: {
					jsx: true,
				},
			},
			globals: {
				// Node.js globals (available in both environments)
				Buffer: 'readonly',
				process: 'readonly',
				global: 'readonly',
				__dirname: 'readonly',
				__filename: 'readonly',
				require: 'readonly',
				module: 'readonly',
				exports: 'readonly',
			},
		},
		plugins: {
			'@typescript-eslint': typescript,
			import: importResolver,
		},
		rules: {
			...typescript.configs.recommended.rules,

			// TypeScript specific rules (incorporating existing configs)
			'@typescript-eslint/no-unused-vars': [
				'error',
				{ argsIgnorePattern: '^_' },
			],
			'@typescript-eslint/no-explicit-any': 'off', // Disabled in existing API/RAG configs
			'@typescript-eslint/explicit-function-return-type': 'off',
			'@typescript-eslint/explicit-module-boundary-types': 'off',
			'@typescript-eslint/no-non-null-assertion': 'warn',
			'@typescript-eslint/interface-name-prefix': 'off', // From existing configs

			// Import rules
			'import/order': [
				'error',
				{
					groups: [
						'builtin',
						'external',
						'internal',
						'parent',
						'sibling',
						'index',
					],
				},
			],
			'import/no-unresolved': 'off', // TypeScript handles this

			// General rules
			'no-console': ['error', { allow: ['warn', 'error'] }],
			'no-debugger': 'error',
			'no-var': 'error',
			'prefer-const': 'error',
			'no-undef': 'off',
		},
	},

	// React files configuration
	{
		files: ['**/chat/**/*.{ts,tsx}', '**/dashboard/**/*.{ts,tsx}'],
		plugins: {
			react: react,
			'react-hooks': reactHooks,
		},
		settings: {
			react: {
				version: 'detect',
			},
		},
		rules: {
			...react.configs.recommended.rules,
			...reactHooks.configs.recommended.rules,

			// React specific rules
			'react/react-in-jsx-scope': 'off',
			'react/prop-types': 'off',
			'react/jsx-uses-react': 'off',
			'react/jsx-uses-vars': 'error',
			'react-hooks/rules-of-hooks': 'error',
			'react-hooks/exhaustive-deps': 'warn',
		},
	},

	// Next.js specific configuration for chat app
	...compat
		.config({
			extends: ['next/core-web-vitals', 'next/typescript'],
			settings: {
				next: {
					rootDir: 'apps/chat/',
				},
			},
		})
		.map((config) => ({
			...config,
			files: ['**/chat/**/*.{ts,tsx}'],
		})),

	// Next.js specific configuration for dashboard app
	...compat
		.config({
			extends: ['next/core-web-vitals', 'next/typescript'],
			settings: {
				next: {
					rootDir: 'apps/dashboard/',
				},
			},
		})
		.map((config) => ({
			...config,
			files: ['**/dashboard/**/*.{ts,tsx}'],
		})),

	// Node.js/API files configuration
	{
		files: ['**/api/**/*.ts', '**/rag/**/*.ts'],
		languageOptions: {
			globals: {
				process: 'readonly',
				Buffer: 'readonly',
				__dirname: 'readonly',
				__filename: 'readonly',
				global: 'readonly',
			},
		},
	},

	// Test files configuration
	{
		files: [
			'**/*.test.{ts,tsx}',
			'**/*.spec.{ts,tsx}',
			'**/test/**/*.{ts,tsx}',
		],
		languageOptions: {
			globals: {
				describe: 'readonly',
				it: 'readonly',
				test: 'readonly',
				expect: 'readonly',
				beforeEach: 'readonly',
				afterEach: 'readonly',
				beforeAll: 'readonly',
				afterAll: 'readonly',
				jest: 'readonly',
			},
		},
		rules: {
			'@typescript-eslint/no-explicit-any': 'off',
		},
	},

	// Configuration files
	{
		files: ['**/*.config.{js,ts}', '**/.*rc.{js,ts}'],
		rules: {
			'@typescript-eslint/no-require-imports': 'off',
		},
	},
];
