export interface Message {
	id: string;
	sessionId: string;
	type: string;
	query?: string;
	retrieval_result?: string;
	summary?: string;
	response?: string;
	createdAt: string;
	status: string;
	searchParams?: string;
}

export interface User {
	id: string;
	logtoUserId?: string;
	name?: string;
	email: string;
	createdAt: string;
	updatedAt: string;
}

export interface Session {
	id: string;
	clientId: string;
	openAiThreadId?: string;
	createdAt: string;
	updatedAt: string;
	userId: string;
	user?: User;
	messages?: Message[];
	messageCount: number;
}

export interface SessionsResponse {
	data: Session[];
	meta: {
		total: number;
		pages: number;
		page: number;
		limit: number;
	};
}

export interface UseSessionsProps {
	page?: number;
	limit?: number;
	email?: string;
	startDate?: string;
	endDate?: string;
	includeEmpty?: boolean;
}
