import { fetchApi } from '../../api';

export async function scrapeUrl(url: string) {
	const response = await fetchApi('/firecrawl/scrape', {
		method: 'POST',
		body: JSON.stringify({ url }),
		headers: {
			'Content-Type': 'application/json',
		},
	});

	return response;
}
