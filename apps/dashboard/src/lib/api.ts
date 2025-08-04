const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
	const url = `${API_BASE_URL}${endpoint}`;

	const response = await fetch(url, {
		...options,
		headers: {
			...options.headers,
			'x-api-key': API_KEY || '',
			'Content-Type': 'application/json',
		},
	});

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let responseBody: any = null;

	try {
		responseBody = await response.json();
	} catch (err) {
		// If JSON parsing fails, keep body null
		console.warn('Failed to parse error response:', err);
		return {
			error: 'Failed to parse error response',
		};
	}

	if (!response.ok) {
		// Try to extract a meaningful message
		console.warn('Response not ok:', responseBody);
		const errorMessage =
			responseBody?.message || response.statusText || 'Unknown error';
		return {
			error: errorMessage,
		};
	}

	return responseBody;
}
