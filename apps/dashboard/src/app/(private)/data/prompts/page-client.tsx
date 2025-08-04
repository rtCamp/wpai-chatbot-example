'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { PromptsTable } from '@wpai-chatbot/dashboard/components/features/prompts/prompts-table';

export default function PromptsPageClient() {
	const [queryClient] = useState(() => new QueryClient());

	return (
		<QueryClientProvider client={queryClient}>
			<h1 className="text-xl font-bold mb-4">Prompt Management</h1>
			<PromptsTable />
		</QueryClientProvider>
	);
}
