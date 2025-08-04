'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { ChatsTable } from '@wpai-chatbot/dashboard/components/features/chats/chats-table';

type PageProps = {
	params: {
		id: string;
	};
};

export default function SingleChatPageClient({ params }: PageProps) {
	const [queryClient] = useState(() => new QueryClient());

	return (
		<QueryClientProvider client={queryClient}>
			<ChatsTable id={params.id} />
		</QueryClientProvider>
	);
}
