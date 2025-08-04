import { fetchApi } from '../../api';

export async function docsPermission(url: string, userEmail: string) {
	return await fetchApi('/firecrawl/check-docs-permission', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			url,
			userEmail,
		}),
	});
}
