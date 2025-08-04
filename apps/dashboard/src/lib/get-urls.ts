import { fetchApi } from './api';

export async function getUrls(endpoint: string = '/firecrawl/get-urls') {
	const response = await fetchApi(endpoint);
	return response;
}
