import { safelySplitHtml } from '@wpai-chatbot/chat/lib/html-parser';
import { RetrievalResponse } from '@wpai-chatbot/chat/interfaces/retrieval';

export async function streamMessage(
	messageId: string,
	onProgress: (content: string, isThinking: boolean) => void,
	onComplete: (content: string, references: RetrievalResponse[]) => void,
	onError: () => void,
) {
	let htmlBuffer = '';
	let messageResults: RetrievalResponse[] = [];
	const wordQueue: string[] = [];
	let isProcessingWords = false;
	let tempBuffer = '';

	try {
		const streamUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/messages/${messageId}/stream`;

		const response = await fetch(streamUrl, {
			headers: {
				'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '',
			},
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		// Function to process word queue
		const processWordQueue = async () => {
			if (isProcessingWords || wordQueue.length === 0) return;

			isProcessingWords = true;

			let lastWord = '';

			while (wordQueue.length > 0) {
				const chunk = wordQueue.shift() || '';

				// Skip duplicate words
				if (!chunk.startsWith('<') && chunk.trim()) {
					const word = chunk.trim();
					if (word === lastWord) {
						continue;
					}
					lastWord = word;
				}

				htmlBuffer += chunk;

				if (
					chunk.endsWith('>') || // Complete HTML tag
					chunk.endsWith(' ') || // Word with space
					wordQueue.length === 0 // Last chunk
				) {
					onProgress(htmlBuffer, false);
					await new Promise((resolve) => setTimeout(resolve, 15));
				}
			}

			isProcessingWords = false;
		};

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const reader = response.body!.getReader();
		const decoder = new TextDecoder();

		while (true) {
			const { done, value } = await reader.read();

			if (done) break;

			const chunk = decoder.decode(value, { stream: true });
			const lines = chunk.split('\n');

			for (const line of lines) {
				if (!line.trim()) continue;

				try {
					// Check if line starts with "message"
					if (line.startsWith('message')) {
						// Extract the JSON part after "message"
						const jsonStr = line.substring('message'.length);

						// Make sure we have a valid JSON string
						if (!jsonStr.trim()) continue;

						const data = JSON.parse(jsonStr);

						// Handle progress updates
						if (
							(data.initializing || data.progress) &&
							!data.content
						) {
							onProgress(
								data.progress || 'Connecting to assistant...',
								true,
							);
							continue;
						}

						// Handle content updates
						if (data.content && typeof data.content === 'string') {
							if (data.content.trim() !== '') {
								tempBuffer += data.content;

								const hasHtml = tempBuffer.includes('</');
								const isSubstantialText =
									!hasHtml && tempBuffer.length > 10;
								const isCompleteSentence =
									!hasHtml && /[.!?](\s|$)/.test(tempBuffer);

								if (
									hasHtml ||
									isSubstantialText ||
									isCompleteSentence
								) {
									const chunks = safelySplitHtml(tempBuffer);
									wordQueue.push(...chunks);
									tempBuffer = '';
									processWordQueue();
								}
							}
						}

						if (data.results && Array.isArray(data.results)) {
							messageResults = data.results;
						}

						if (data.done) {
							if (tempBuffer) {
								const chunks = safelySplitHtml(tempBuffer);
								wordQueue.push(...chunks);
								tempBuffer = '';
								processWordQueue();
							}

							const checkComplete = setInterval(() => {
								if (
									!isProcessingWords &&
									wordQueue.length === 0
								) {
									clearInterval(checkComplete);
									onComplete(htmlBuffer, messageResults);
								}
							}, 50);

							break;
						}
					}
				} catch (e) {
					console.error('Error parsing message data:', e, line);
				}
			}
		}
	} catch (error) {
		console.error('Streaming error:', error);
		onError();
	}
}
