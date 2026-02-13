// eslint.config.mjs
import tsparser from '@typescript-eslint/parser';
import obsidianmd from 'eslint-plugin-obsidianmd';

export default [
	{
		files: ['**/*.ts'],
		ignores: ['**/__tests__/**', '**/__mocks__/**', '**/*.test.ts'],
		languageOptions: {
			parser: tsparser,
			parserOptions: {
				project: './tsconfig.json',
			},
		},
		plugins: {
			obsidianmd,
		},
		rules: {
			// Obsidian recommended rules
			...obsidianmd.configs.recommended,

			// Custom rule overrides
			'obsidianmd/sample-names': 'off', // Allow sample names
			'obsidianmd/prefer-file-manager-trash-file': 'error', // Enforce trash usage
		},
	},
	{
		// Simpler config for test files (no TypeScript project parsing)
		files: ['**/__tests__/**', '**/__mocks__/**', '**/*.test.ts'],
		languageOptions: {
			parser: tsparser,
		},
	},
];
