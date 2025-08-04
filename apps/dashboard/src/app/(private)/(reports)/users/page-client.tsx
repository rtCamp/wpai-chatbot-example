'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { UsersTable } from '@wpai-chatbot/dashboard/components/features/users/users-table';

export default function UsersPageClient() {
	const [queryClient] = useState(() => new QueryClient());

	return (
		<QueryClientProvider client={queryClient}>
			<h1 className="text-xl font-bold mb-4">Users</h1>
			<UsersTable />
		</QueryClientProvider>
	);
}
