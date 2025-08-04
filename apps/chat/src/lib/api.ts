const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
	const url = `${API_BASE_URL}${endpoint}`;

	// Merge headers
	const headers = {
		...options.headers,
		'x-api-key': API_KEY || '',
	};

	const response = await fetch(url, {
		...options,
		headers,
	});

	if (!response.ok) {
		throw new Error(`API error: ${response.status}`);
	}

	// Check if response has content before parsing JSON. Mostly for DELETE requests.
	if (response.status === 204) {
		return null;
	}

	return await response.json();
}
