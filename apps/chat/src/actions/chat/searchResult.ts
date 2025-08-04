import { fetchApi } from '@wpai-chatbot/chat/lib/api';

type SearchResult = {
	messageId: string;
	keywordWeight: string;
};

export async function searchResult({ messageId, keywordWeight }: SearchResult) {
	return await fetchApi('/messages/search', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			messageId,
			keywordWeight,
		}),
	});
}
