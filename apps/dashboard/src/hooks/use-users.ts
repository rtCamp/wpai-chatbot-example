// hooks/use-users.ts
import { useQuery } from '@tanstack/react-query';

import { UsersResponse, UseUsersProps } from '../interfaces/user';

interface UseUsersPaginationProps extends UseUsersProps {
	page?: number;
	limit?: number;
}

export function useUsers({
	email,
	page = 1,
	limit = 10,
}: UseUsersPaginationProps = {}) {
	return useQuery<UsersResponse>({
		queryKey: ['users', email, page, limit],
		queryFn: async () => {
			const params = new URLSearchParams();
			if (email) params.append('email', email);
			params.append('page', page.toString());
			params.append('limit', limit.toString());

			const response = await fetch(`/api/users?${params.toString()}`);
			if (!response.ok) {
				throw new Error('Failed to fetch users');
			}
			return response.json();
		},
	});
}
