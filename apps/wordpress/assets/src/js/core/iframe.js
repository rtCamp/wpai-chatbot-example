document.addEventListener(
	'DOMContentLoaded',
	function () {
		const button = document.getElementById('wpai-chatbot-button');
		const container = document.getElementById('wpai-chatbot-container');
		const iframe = document.getElementById('wpai-chatbot-frame');

		button.classList.add('wpai-chatbot-chat-mode');
		button.style.display = 'flex';

		button.addEventListener('click', function () {
			if (container.classList.contains('wpai-chatbot-hidden')) {
				container.classList.remove('wpai-chatbot-hidden');
				container.classList.add('wpai-chatbot-visible');
				button.classList.remove('wpai-chatbot-chat-mode');
				button.classList.add('wpai-chatbot-close-mode');
				button.classList.add('is-open'); // Add the is-open class for the animation

				try {
					if (iframe && iframe.contentWindow) {
						const origin = new URL(iframe.src).origin;
						iframe.contentWindow.postMessage(
							{ type: 'show' },
							origin
						);
					}
				} catch (e) {
					console.error('Error sending message to iframe:', e); // eslint-disable-line no-console
				}
			} else {
				container.classList.remove('wpai-chatbot-visible');
				container.classList.add('wpai-chatbot-hidden');
				button.classList.remove('wpai-chatbot-close-mode');
				button.classList.add('wpai-chatbot-chat-mode');
				button.classList.remove('is-open');

				try {
					if (iframe && iframe.contentWindow) {
						const origin = new URL(iframe.src).origin;
						iframe.contentWindow.postMessage(
							{ type: 'close' },
							origin
						);
					}
				} catch (e) {
					console.error('Error sending message to iframe:', e); // eslint-disable-line no-console
				}
			}
		});

		document.addEventListener('keydown', function (event) {
			if (
				event.key === 'Escape' &&
				!container.classList.contains('wpai-chatbot-hidden')
			) {
				container.classList.remove('wpai-chatbot-visible');
				container.classList.add('wpai-chatbot-hidden');
				button.classList.remove('wpai-chatbot-close-mode');
				button.classList.add('wpai-chatbot-chat-mode');
				button.classList.remove('is-open');
			}
		});

		if (iframe) {
			window.addEventListener('message', function (event) {
				try {
					const origin = new URL(iframe.src).origin;
					if (event.origin !== origin) {
						return;
					}

					if (event.data && event.data.type === 'resize') {
						iframe.style.height = event.data.height + 'px';
					}

					if (event.data && event.data.type === 'close') {
						container.classList.remove('wpai-chatbot-visible');
						container.classList.add('wpai-chatbot-hidden');
						button.classList.remove('wpai-chatbot-close-mode');
						button.classList.add('wpai-chatbot-chat-mode');
						button.classList.remove('is-open');
					}
				} catch (e) {
					console.error('Error processing message:', e); // eslint-disable-line no-console
				}
			});
		}
	},
	{ once: true }
);
