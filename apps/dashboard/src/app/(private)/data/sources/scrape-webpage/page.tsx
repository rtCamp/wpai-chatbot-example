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
		<>
			<h1 className="text-xl font-bold">Data Sources</h1>
			<p className="text-md text-gray-700 mt-2">
				Data sources are the origins of the data that is ingested into
				the system. Add urls in the below input to scrape and load it
				into memory.
			</p>

			<UrlInput onSuccess={handleUrlAdded} />

			<UrlList refreshkey={refreshUrls} />

			<Toaster />
		</>
	);
}
