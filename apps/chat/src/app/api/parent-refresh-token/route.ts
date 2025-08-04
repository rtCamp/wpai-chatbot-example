// /api/parent-refresh-token/route.ts
import { NextResponse } from 'next/server';
import { getAccessToken } from '@logto/next/server-actions';
import { logtoConfig } from '@wpai-chatbot/chat/app/logto';

export async function GET() {
	try {
		// Get a fresh access token from Logto
		const accessToken = await getAccessToken(logtoConfig);

		if (!accessToken) {
			return NextResponse.json(
				{ error: 'Failed to get access token' },
				{ status: 401 },
			);
		}

		return NextResponse.json({ token: accessToken });
	} catch (error) {
		console.error('Error refreshing token:', error);
		return NextResponse.json(
			{ error: 'Failed to refresh token' },
			{ status: 500 },
		);
	}
}
