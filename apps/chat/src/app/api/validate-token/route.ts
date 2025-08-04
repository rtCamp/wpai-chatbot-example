import { NextResponse } from 'next/server';

const LOGTO_ENDPOINT = process.env.LOGTO_ENDPOINT;
const LOGTO_APP_ID = process.env.LOGTO_APP_ID;
const LOGTO_APP_SECRET = process.env.LOGTO_APP_SECRET;

export async function POST(request: Request) {
	try {
		const { token } = await request.json();

		if (!token) {
			return NextResponse.json(
				{ valid: false, error: 'No token provided' },
				{ status: 400 },
			);
		}

		// Introspect the opaque token
		const response = await fetch(
			`${LOGTO_ENDPOINT}/oidc/token/introspection`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: new URLSearchParams({
					token,
					client_id: LOGTO_APP_ID as string,
					client_secret: LOGTO_APP_SECRET as string,
				}).toString(),
			},
		);

		if (!response.ok) {
			return NextResponse.json(
				{
					valid: false,
					error: `Introspection error: ${response.status}`,
				},
				{ status: 401 },
			);
		}

		const introspectionResult = await response.json();

		if (!introspectionResult.active) {
			return NextResponse.json(
				{ valid: false, error: 'Please login again' },
				{ status: 401 },
			);
		}

		// Return user information and expiration info from the introspection response
		return NextResponse.json({
			valid: true,
			claims: {
				sub: introspectionResult.sub,
				exp: introspectionResult.exp,
			},
		});
	} catch (error) {
		console.error('Token validation error:', error);
		return NextResponse.json(
			{
				valid: false,
				error: (error as Error)?.message || 'Unknown error',
			},
			{ status: 500 },
		);
	}
}
