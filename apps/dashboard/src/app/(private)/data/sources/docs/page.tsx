'use client';

import { useState } from 'react';
import { Toaster } from '@wpai-chatbot/dashboard/components/ui/sonner';

import UrlList from './components/url-list';
import UrlInput from './components/url-input';

export default function Page() {
	const [refreshUrls, setRefreshUrls] = useState(0);

	const handleUrlAdded = () => {
		// Increment to trigger useEffect in UrlList
		setRefreshUrls((prev) => prev + 1);
	};

	return (
		/* eslint-disable */
		<>
			<h1 className="text-xl font-bold">Data Sources</h1>
			<p className="text-md text-gray-700 mt-2">
				Add Google Docs URL with editor access to{' '}
				{process.env.NEXT_PUBLIC_GOOGLE_DOCS_CLIENT_MAIL}, we will fetch
				its content and load it into WPAI_Chatbot's memory.
			</p>

			<UrlInput onSuccess={handleUrlAdded} />

			<UrlList refreshkey={refreshUrls} />

			<Toaster />
		</>
		/* eslint-enable */
	);
}
