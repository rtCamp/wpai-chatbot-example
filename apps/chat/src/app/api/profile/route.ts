import { NextResponse } from 'next/server';

export async function GET(request: Request) {
	try {
		const authHeader = request.headers.get('Authorization');

		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return NextResponse.json(
				{ error: 'Missing authorization' },
				{ status: 401 },
			);
		}

		const token = authHeader.split(' ')[1];

		// Forward request to Logto
		const response = await fetch(
			`${process.env.LOGTO_ENDPOINT}/api/my-account`,
			{
				headers: {
					Authorization: `Bearer ${token}`,
				},
			},
		);

		if (!response.ok) {
			return NextResponse.json(
				{ error: 'Failed to fetch user info' },
				{ status: response.status },
			);
		}

		const userInfo = await response.json();
		return NextResponse.json(userInfo);
	} catch {
		return NextResponse.json(
			{ error: 'Error fetching user info' },
			{ status: 500 },
		);
	}
}
