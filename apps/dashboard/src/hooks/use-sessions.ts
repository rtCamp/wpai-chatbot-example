import { useQuery } from '@tanstack/react-query';

import { SessionsResponse, UseSessionsProps } from '../interfaces/session';

export function useSessions({
	page = 1,
	limit = 10,
	email,
	startDate,
	endDate,
	includeEmpty = false,
}: UseSessionsProps = {}) {
	return useQuery<SessionsResponse>({
		queryKey: [
			'sessions',
			page,
			limit,
			email,
			startDate,
			endDate,
			includeEmpty,
		],
		queryFn: async () => {
			const params = new URLSearchParams({
				page: page.toString(),
				limit: limit.toString(),
			});

			if (email) params.append('userEmail', email);
			if (startDate) params.append('startDate', startDate);
			if (endDate) params.append('endDate', endDate);
			if (includeEmpty) params.append('includeEmpty', 'true');

			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_BASE_URL}/sessions?${params.toString()}`,
				{
					headers: {
						'X-API-KEY': process.env.NEXT_PUBLIC_API_KEY || '',
						accept: '*/*',
					},
				},
			);

			if (!response.ok) {
				throw new Error('Failed to fetch sessions');
			}

			return response.json();
		},
	});
}
