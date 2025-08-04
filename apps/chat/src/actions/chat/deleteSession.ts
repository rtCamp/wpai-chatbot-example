import { fetchApi } from '@wpai-chatbot/chat/lib/api';

export async function deleteSession(sessionId: string) {
	return await fetchApi(`/sessions/${sessionId}`, {
		method: 'DELETE',
		headers: {
			'Content-Type': 'application/json',
		},
	});
}
