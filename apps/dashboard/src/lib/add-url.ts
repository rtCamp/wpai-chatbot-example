import { fetchApi } from './api';
export async function addUrl(
	url: string,
	endpoint: string = '/firecrawl/add-url',
) {
	const response = await fetchApi(endpoint, {
		method: 'POST',
		body: JSON.stringify({ url }),
		headers: {
			'Content-Type': 'application/json',
		},
	});

	return response;
}
