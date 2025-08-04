import { NextResponse } from 'next/server';

export async function middleware() {
	const response = NextResponse.next();

	// TODO: Get allowed domains from your database for user
	// For now using hardcoded domains
	const allowedDomains = process.env.ALLOWED_IFRAME_ORIGINS?.split(',').map(
		(domain) => domain.trim(),
	);

	if (!allowedDomains || allowedDomains?.length === 0) return response;

	// For a real implementation, we would fetch this information dynamically
	// based on the chatbot ID param in the request

	// Build the CSP header with all allowed domains
	const frameAncestors = allowedDomains
		.map((domain) => {
			// Support for both http and https
			return `https://${domain} http://${domain}`;
		})
		.join(' ');

	// Set the header
	response.headers.set(
		'Content-Security-Policy',
		`frame-ancestors 'self' ${frameAncestors}`,
	);

	return response;
}

export const config = {
	matcher: '/:path*',
};
