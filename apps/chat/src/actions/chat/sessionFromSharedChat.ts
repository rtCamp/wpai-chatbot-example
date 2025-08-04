import { fetchApi } from '@wpai-chatbot/chat/lib/api';
import { User } from '@wpai-chatbot/chat/interfaces/user';

export async function sessionFromSharedChat(user: User, sharedChatId: string) {
	return await fetchApi('/sessions/create-from-shared-chat', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			userId: user.id,
			name: user.name,
			email: user.email,
			sharedChatId,
		}),
	});
}
