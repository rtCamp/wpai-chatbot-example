import { fetchApi } from '@wpai-chatbot/chat/lib/api';
import { ChatbotResponse } from '@wpai-chatbot/chat/interfaces/chats';
import { RetrievalResponse } from '@wpai-chatbot/chat/interfaces/retrieval';

export async function pollMessage(
	messageId: string,
	onComplete: (content: string, results: RetrievalResponse[]) => void,
	onError: () => void,
) {
	let messageStatus = 'pending';
	let attempts = 0;

	while (messageStatus === 'pending' && attempts < 20) {
		await new Promise((resolve) => setTimeout(resolve, 1000));
		attempts++;

		try {
			const messageData = await fetchApi(`/messages/${messageId}`);
			messageStatus = messageData.status;

			if (messageStatus === 'completed') {
				let messageContent: ChatbotResponse = {
					answer: '',
					results: [],
				};

				try {
					messageContent = JSON.parse(messageData.response);
				} catch (e) {
					console.error('Error parsing message response:', e);
					messageContent = {
						answer: 'Sorry, I encountered an error processing your request.',
						results: [],
					};
				}

				onComplete(messageContent.answer, messageContent.results);
				break;
			}
		} catch (error) {
			console.error('Error polling message:', error);
		}
	}

	if (messageStatus !== 'completed') {
		onError();
	}
}
