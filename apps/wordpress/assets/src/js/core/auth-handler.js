function AuthInit() {
	// Retrieve any existing auth token from localStorage
	let authToken = localStorage.getItem('wpai_chatbot_auth_token');
	const trackUID = getCookie('track_uid');
	const currentPageUrl = new URL(window.location.href).href;

	function getCookie(name) {
		const regex = new RegExp(`(^| )${name}=([^;]+)`);
		const match = document.cookie.match(regex);
		if (match) {
			return match[2];
		}
	}

	// When the page loads, check if we have a token and track_uid to append to the iframe
	window.addEventListener(
		'DOMContentLoaded',
		function () {
			const frame = document.getElementById('wpai-chatbot-frame');
			if (frame && authToken) {
				// If we have a token, add it as a URL parameter to the iframe
				if (!frame.src.includes('?')) {
					frame.src = `${frame.src}?token=${encodeURIComponent(authToken)}`;
				}
			}

			if (frame && trackUID) {
				const baseUrl = new URL(frame.src);
				baseUrl.searchParams.set('track_uid', trackUID);
				frame.src = baseUrl.toString();
			}

			if (frame && currentPageUrl) {
				const baseUrl = new URL(frame.src);
				baseUrl.searchParams.set('pageUrl', currentPageUrl);
				frame.src = baseUrl.toString();
			}
		},
		{ once: true }
	);

	// Listen for messages from the iframe
	window.addEventListener('message', function (event) {
		const { type, returnUrl } = event.data;

		if (type === 'WPAI_CHATBOT_AUTH_REQUIRED') {
			// Open authentication window when requested
			window.open(returnUrl, 'DeepSearchAuth');
		}

		if (type === 'WPAI_CHATBOT_AUTH_SUCCESS' && event.data.token) {
			// Store the new token
			authToken = event.data.token;
			localStorage.setItem('wpai_chatbot_auth_token', authToken);

			// Update the iframe with the new token
			const frame = document.getElementById('wpai-chatbot-frame');
			if (frame) {
				// Force iframe reload with the new token
				const baseUrl = frame.src.split('?')[0]; // Get the base URL without parameters
				// Create a fresh URL with the new token
				frame.src = `${baseUrl}?token=${encodeURIComponent(authToken)}&t=${Date.now()}`;
				// The t parameter forces a reload by making the URL unique
			}
		}
	});

	const params = new URLSearchParams(currentPageUrl.split('?')[1] || '');
	const parameters = Object.fromEntries(params.entries());

	if (
		parameters.utm_source &&
		parameters.utm_medium &&
		'wpai-chatbot' === parameters.utm_source &&
		'referral' === parameters.utm_medium
	) {
		const button = document.getElementById('wpai-chatbot-button');

		setTimeout(function () {
			// If the button is present, click it after a short delay.
			if (button) {
				button.click();
			}
		}, 1000);
	}
}

// Initialize the authentication system when the page loads
document.addEventListener('DOMContentLoaded', AuthInit, { once: true });
