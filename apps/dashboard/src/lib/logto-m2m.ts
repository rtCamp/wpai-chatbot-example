import { logtoM2MConfig } from '../app/logto';

export async function getM2MToken() {
	const headers = new Headers();
	headers.append('Content-Type', 'application/x-www-form-urlencoded');
	headers.append(
		'Authorization',
		`Basic ${btoa(`${logtoM2MConfig.appId}:${logtoM2MConfig.appSecret}`)}`,
	);

	const urlencoded = new URLSearchParams();
	urlencoded.append('grant_type', 'client_credentials');
	urlencoded.append('resource', 'https://default.logto.app/api');
	urlencoded.append('scope', 'all');

	const response = await fetch(`${logtoM2MConfig.endpoint}/oidc/token`, {
		method: 'POST',
		headers: headers,
		body: urlencoded,
	});

	if (!response.ok) {
		throw new Error('Failed to obtain M2M token');
	}

	const tokenData = await response.json();
	return tokenData.access_token;
}
