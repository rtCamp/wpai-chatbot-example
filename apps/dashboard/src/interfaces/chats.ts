import { User } from './user';

export interface Chat {
	id: string;
	type: string;
	status: string;
	summary: string;
	retrieval_result: string;
	createdAt: string;
	query: string;
	user: ChatUser;
	pageUrl: string;
	response: string;
}

export interface ChatsResponse {
	data: Chat[];
	user: User;
	meta: {
		total: number;
		page: number;
		limit: number;
		pages: number;
	};
}

export interface UseChatsProps {
	page?: number;
	limit?: number;
	type?: string;
	status?: string;
	startDate?: string;
	endDate?: string;
	userId?: string;
}

export interface ChatbotResponse {
	answer: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	results: any[];
}

export interface SessionMessage {
	id: string;
	sessionId: string;
	type: string;
	query: string;
	retrieval_result: string;
	summary: string;
	response: string;
	createdAt: string;
	status: string;
	searchParams: string;
}

export interface Session {
	id: string;
	clientId: string;
	openAiThreadId: string;
	createdAt: string;
	updatedAt: string;
	messages: SessionMessage[];
}

export interface SessionsResponse {
	data: Session[];
	meta: {
		total: number;
		page: number;
		limit: number;
		pages: number;
	};
}

export interface ChatUser {
	id: string;
	logtoUserId: string;
	name: string;
	email: string;
	createdAt: string;
	updatedAt: string;
}
