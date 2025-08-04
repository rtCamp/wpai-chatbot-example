export interface Message {
	id: string;
	sessionId: string;
	type: string;
	query: string;
	retrieval_result: string;
	summary: string;
	response: string;
	createdAt: Date;
	status: string;
	pageUrl: string;
}
