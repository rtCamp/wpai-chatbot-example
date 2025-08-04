import { fetchApi } from '../../api';

export async function deleteIntegratedUrl(
	url: string,
	endpoint: string = '/firecrawl/delete-integrated-website',
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
