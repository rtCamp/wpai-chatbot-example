import { fetchApi } from '@wpai-chatbot/chat/lib/api';

type createSession = {
	userId: string;
	name: string;
	email: string;
	userTimeZone: string;
	clientId: string;
};

export async function createSession({
	userId,
	name,
	email,
	userTimeZone,
	clientId,
}: createSession) {
	return await fetchApi('/sessions', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			clientId: clientId,
			userId: userId,
			name: name,
			email: email,
			userTimeZone: userTimeZone,
		}),
	});
}
