'use server';

import { signIn } from '@logto/next/server-actions';
import { cookies } from 'next/headers';
import { logtoConfig } from '@wpai-chatbot/chat/app/logto';

export async function signInLogto(formData: FormData) {
	const returnUrl = formData.get('returnUrl')?.toString() || '/';
	const provider = formData.get('provider')?.toString() || 'google';
	const trackUID = formData.get('track_uid')?.toString() || null;

	if (trackUID) {
		(await cookies()).set('track_uid', trackUID, {
			path: '/',
			maxAge: 3600, // 1 hour
			httpOnly: true,
			secure: !['local', 'dev', 'develop', 'development'].includes(
				process.env.NODE_ENV,
			),
			sameSite: 'lax',
		});
	}

	(
		await // Store the return URL in a cookie
		cookies()
	).set('auth-return-url', returnUrl, {
		path: '/',
		maxAge: 3600, // 1 hour
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
	});

	await signIn(logtoConfig, {
		redirectUri: `${process.env.NEXT_PUBLIC_BASE_URL}/callback`,
		directSignIn: {
			method: 'social',
			target: provider,
		},
		extraParams: {
			'hd:*': '*',
		},
	});
}
