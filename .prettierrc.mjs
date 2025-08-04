/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config}
 */
const config = {
	arrowParens: 'always', // Always include parentheses around arrow function arguments
	bracketSpacing: true, // Add space between brackets in object literals
	endOfLine: 'lf', // Use LF for line endings (recommended in most systems)
	printWidth: 80, // Wrap lines at 80 characters
	semi: true, // Add semicolons at the end of statements
	singleQuote: true, // Use single quotes instead of double quotes
	tabWidth: 4, // Use 4 spaces per tab (default)
	trailingComma: 'all', // Add trailing commas where valid in ES5 (objects, arrays, etc.)
	useTabs: true, // Use tabs by default
	overrides: [
		{
			files: ['*.md', '*.yml', '*.yaml'],
			options: {
				useTabs: false,
				tabWidth: 2,
			},
		},
	],
};

export default config;
