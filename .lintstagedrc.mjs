/**
 * @type {import('lint-staged').Configuration}
 */
export default {
	'*.{js,jsx,mjs,cjs,ts,tsx}': ['eslint --fix', 'prettier --write'],
	'!(*.js|*.jsx|*.mjs|*.cjs|*.ts|*.tsx|.husky/*|.prettierignore)': [
		'prettier --write',
	],
};
