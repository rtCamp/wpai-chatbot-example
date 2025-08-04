import {
	getLogtoContext,
	handleSignIn,
	signOut,
} from '@logto/next/server-actions';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { logActivity } from '@wpai-chatbot/chat/actions/crm/salespanel';

import { logtoConfig } from '../logto';

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;

		await handleSignIn(logtoConfig, searchParams);

		// Retrieve the return URL from cookies
		const returnUrl =
			(await cookies()).get('auth-return-url')?.value || '/';
		const trackUID = (await cookies()).get('track_uid')?.value;

		(await cookies()).delete('auth-return-url');
		(await cookies()).delete('track_uid');

		if (trackUID) {
			const {
				claims: {
					// @ts-expect-error: Property 'updated_at' does not exist on type 'IdTokenClaims | undefined'.
					email,
				},
			} = await getLogtoContext(logtoConfig);
			logActivity(trackUID, 'sign-in', { email });
		}

		// Return a redirect response instead of using the redirect function
		return NextResponse.redirect(
			new URL(`${process.env.NEXT_PUBLIC_BASE_URL}${returnUrl}`),
		);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} catch (error: any) {
		if (error.code === 'oidc.access_denied') {
			// Something is wrong; probably used a blacklisted email address.
			const returnUrl = (await cookies()).get('auth-return-url');
			const postLogoutRedirectUri = returnUrl?.value
				? `${process.env.NEXT_PUBLIC_BASE_URL}/auth/flow-not-allowed`
				: `${process.env.NEXT_PUBLIC_BASE_URL}/logout-callback`;

			await signOut(logtoConfig, postLogoutRedirectUri);

			// Return a response here as well
			return NextResponse.redirect(new URL(postLogoutRedirectUri));
		}

		// Handle other errors by returning an error response
		console.error('Authentication error:', error);
		return NextResponse.json(
			{ error: 'Authentication failed' },
			{ status: 500 },
		);
	}
}
