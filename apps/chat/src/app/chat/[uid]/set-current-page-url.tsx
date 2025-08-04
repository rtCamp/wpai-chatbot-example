'use client';

import { useEffect } from 'react';

export default function SetCurrentPageUrl({ pageUrl }: { pageUrl: string }) {
	useEffect(() => {
		if (!pageUrl) {
			return;
		}

		if (localStorage.getItem('pageUrl') !== pageUrl) {
			localStorage.setItem('pageUrl', pageUrl);
		}
	}, [pageUrl]);
	return null;
}
