module.exports = {
	root: true,
	extends: [
		'plugin:@wordpress/eslint-plugin/recommended',
		'plugin:import/recommended',
		'plugin:eslint-comments/recommended',
	],
	plugins: [],
	env: {
		browser: true,
		jquery: true,
	},
	globals: {
		_: true,
	},
	rules: {
		'jsdoc/check-indentation': 'error',
		'no-shadow': 'warn',
	},
	overrides: [
		{
			files: [
				'**/__tests__/**/*.js',
				'**/test/*.js',
				'**/?(*.)test.js',
				'tests/js/**/*.js',
			],
			extends: ['plugin:jest/all'],
			rules: {
				// Add Rules for Jest here
			},
		},
	],
};
