import { fetchApi } from '../../api';

export async function scrapeDocsUrl(url: string) {
	const response = await fetchApi('/firecrawl/scrape-docs', {
		method: 'POST',
		body: JSON.stringify({ url }),
		headers: {
			'Content-Type': 'application/json',
		},
	});

	return response;
}
