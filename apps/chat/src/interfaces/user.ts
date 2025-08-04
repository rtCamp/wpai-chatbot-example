// In interfaces/users.ts
export interface User {
	id: string;
	name?: string;
	primaryEmail?: string;
	email: string;
	username?: string;
	createdAt: string;
	lastSignInAt?: string;
	isActive: boolean;
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
