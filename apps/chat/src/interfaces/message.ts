import { RetrievalResponse } from './retrieval';

export interface Message {
	id: string;
	role: string;
	content: string;
	timestamp: string;
	isThinking?: boolean;
	isError?: boolean;
	isStreaming?: boolean;
	references?: RetrievalResponse[];
	streamData?: {
		messageId: string;
		sessionId: string;
	};
	_forceUpdate?: number;
}

export interface Chat {
	id: string;
	title: string;
	lastMessage: string;
	timestamp: string;
	messages: Message[];
}
