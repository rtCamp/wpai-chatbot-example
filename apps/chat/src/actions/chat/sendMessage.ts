import { fetchApi } from '@wpai-chatbot/chat/lib/api';

export async function sendMessage(
	sessionId: string,
	content: string,
	captchaToken: string,
	pageUrl: string,
) {
	return await fetchApi('/messages', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			sessionId,
			query: content,
			captchaToken,
			pageUrl,
		}),
	});
}
