/**
 * WordPress dependencies
 */
const defaultConfig = require('@wordpress/babel-preset-default');

module.exports = function (api) {
	const config = defaultConfig(api);

	return {
		...config,
		plugins: [
			...config.plugins,
			// Add your own plugins here
		],
		// Enable source maps only in development mode
		sourceMaps: api.env('development') ? 'inline' : false,
		env: {
			production: {
				plugins: [
					...config.plugins,
					// Add your own plugins here
				],
			},
		},
	};
};
