'use client';

import { useState } from 'react';
import { Toaster } from '@wpai-chatbot/dashboard/components/ui/sonner';

import UrlInput from './components/url-input';
import UrlList from './components/url-list';

export default function Page() {
	const [refreshUrls, setRefreshUrls] = useState(0);

	const handleUrlAdded = () => {
		// Increment to trigger useEffect in UrlList
		setRefreshUrls((prev) => prev + 1);
	};

	return (
		<>
			<h1 className="text-xl font-bold">Integrated Websites.</h1>
			<p className="text-md text-gray-700 mt-2">
				You can manage WordPress Websites here, having WPAI_Chatbot
				Plugin activated.
			</p>

			<UrlInput onSuccess={handleUrlAdded} />

			<UrlList refreshkey={refreshUrls} onSuccess={handleUrlAdded} />

			<Toaster />
		</>
	);
}
