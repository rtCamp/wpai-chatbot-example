'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { SessionsTable } from '@wpai-chatbot/dashboard/components/features/sessions/sessions-table';

export default function ChatsPageClient() {
	const [queryClient] = useState(() => new QueryClient());

	return (
		<QueryClientProvider client={queryClient}>
			<SessionsTable />
		</QueryClientProvider>
	);
}
