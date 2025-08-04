export interface User {
	id: string;
	primaryEmail: string;
	email: string;
	name: string;
	avatar: string;
	lastSignInAt: number;
	createdAt: number;
	isSuspended: boolean;
}

export interface UsersResponse {
	data: User[];
	meta: {
		total: number;
		pages: number;
		page: number;
		limit: number;
	};
}

export interface UseUsersProps {
	page?: number;
	limit?: number;
	email?: string;
}
