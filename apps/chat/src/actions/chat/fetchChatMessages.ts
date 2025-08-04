import { Message } from '@wpai-chatbot/chat/interfaces/message';
import { fetchApi } from '@wpai-chatbot/chat/lib/api';
import { Session } from '@wpai-chatbot/chat/interfaces/chats';

export async function fetchChatMessages(chatId: string): Promise<Message[]> {
	try {
		const session: Session = await fetchApi(`/sessions/${chatId}`);
		const processedMessages: Message[] = [];

		if (session.messages.length === 0) {
			processedMessages.push({
				id: 'welcome-' + Date.now(),
				role: 'system',
				content:
					'Ask me anything about our work, our WordPress expertise, and anything in between!',
				timestamp: new Date().toISOString(),
			});
			return processedMessages;
		}

		for (const msg of session.messages) {
			processedMessages.push({
				id: msg.id,
				role: 'user',
				content: msg.query,
				timestamp: msg.createdAt,
			});

			if (msg.status === 'completed' && msg.response) {
				try {
					const responseObj = JSON.parse(msg.response);
					processedMessages.push({
						id: msg.id + '-assistant',
						role: 'assistant',
						content:
							responseObj.answer ||
							"Sorry, I couldn't process that request.",
						timestamp: msg.createdAt,
						references: responseObj.results || [],
					});
				} catch {
					processedMessages.push({
						id: msg.id + '-assistant',
						role: 'assistant',
						content:
							'Sorry, there was an error processing the response.',
						timestamp: msg.createdAt,
						isError: true,
					});
				}
			}
		}

		return processedMessages;
	} catch (error) {
		console.error('Error fetching chat:', error);
		return [];
	}
}
