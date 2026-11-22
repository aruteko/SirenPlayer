import { defineConfig } from 'oxlint'

export default defineConfig({
	plugins: ['react', 'typescript', 'unicorn', 'eslint', 'oxc', 'import', 'promise'],
	categories: {
		correctness: 'error',
		suspicious: 'error',
		pedantic: 'allow',
		perf: 'error',
		style: 'allow',
		restriction: 'allow',
	},
	env: {
		builtin: true,
		es2022: true,
		browser: true,
		node: true,
	},
	ignorePatterns: [
		'**/node_modules/**',
		'**/.expo/**',
		'**/build/**',
		'android/**',
		'out/**',
		'**/*.js',
	],
	rules: {
		'react/react-in-jsx-scope': 'off',
		'react/style-prop-object': 'off',
		// BBPlayer 由来の FluidBackground が，副作用の中で状態を更新する
		'react/set-state-in-effect': 'off',
		'typescript/consistent-return': 'off',
		'no-unused-vars': [
			'error',
			{
				args: 'all',
				argsIgnorePattern: '^_',
				caughtErrors: 'all',
				caughtErrorsIgnorePattern: '^_',
				varsIgnorePattern: '^_',
				ignoreRestSiblings: true,
			},
		],
		'no-console': 'error',
		'react-hooks/exhaustive-deps': 'error',
		'typescript/no-explicit-any': 'error',
		'typescript/no-misused-promises': ['error', { checksVoidReturn: false }],
		'typescript/no-unsafe-type-assertion': 'allow',
	},
})
