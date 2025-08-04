import { Chat } from '@wpai-chatbot/chat/interfaces/message';
import { fetchApi } from '@wpai-chatbot/chat/lib/api';
import { SessionsResponse } from '@wpai-chatbot/chat/interfaces/chats';

export async function fetchSessions(userId: string): Promise<Chat[] | null> {
	try {
		const response: SessionsResponse = await fetchApi(
			`/sessions/user/${userId}`,
		);

		return response.data.map((session) => {
			const lastMessage =
				session.messages.length > 0
					? session.messages[session.messages.length - 1]
					: null;

			return {
				id: session.id,
				title: lastMessage?.query || 'New Conversation',
				lastMessage: lastMessage?.response
					? (() => {
							try {
								return (
									JSON.parse(
										lastMessage.response,
									).answer.substring(0, 50) + '...'
								);
							} catch {
								return '';
							}
						})()
					: '',
				timestamp: lastMessage?.createdAt || session.updatedAt,
				messages: session.messages.map((msg) => ({
					id: msg.id,
					role: 'user',
					content: msg.query || '',
					timestamp: msg.createdAt,
				})),
			};
		});
	} catch (error) {
		console.error('Error fetching sessions:', error);
		return [];
	}
}
