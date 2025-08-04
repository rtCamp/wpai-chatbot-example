import { useQuery } from '@tanstack/react-query';

import { ChatsResponse } from '../interfaces/chats';

export function useSessionMessages(
	sessionId: string,
	{ page = 1, limit = 10 }: { page?: number; limit?: number } = {},
) {
	return useQuery<ChatsResponse>({
		queryKey: ['sessionMessages', sessionId, page, limit],
		queryFn: async () => {
			// Build query parameters
			const params = new URLSearchParams({
				page: page.toString(),
				limit: limit.toString(),
				sort: 'asc',
			});

			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_BASE_URL}/messages/session/${sessionId}?${params.toString()}`,
				{
					headers: {
						'X-API-KEY': process.env.NEXT_PUBLIC_API_KEY || '',
						accept: '*/*',
					},
				},
			);

			if (!response.ok) {
				throw new Error('Failed to fetch session messages');
			}

			return response.json();
		},
	});
}
