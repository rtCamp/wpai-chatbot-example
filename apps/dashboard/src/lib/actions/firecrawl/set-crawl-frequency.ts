import { fetchApi } from '../../api';

export async function setCrawlFrequency(
	url: string,
	frequency: string,
	endpoint: string = '/firecrawl/set-crawl-frequency',
) {
	const response = await fetchApi(endpoint, {
		method: 'POST',
		body: JSON.stringify({ url, frequency }),
		headers: {
			'Content-Type': 'application/json',
		},
	});

	return response;
}
