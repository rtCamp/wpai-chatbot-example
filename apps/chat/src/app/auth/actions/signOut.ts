'use server';

import { signOut } from '@logto/next/server-actions';
import { cookies } from 'next/headers';
import { logtoConfig } from '@wpai-chatbot/chat/app/logto';

export async function signOutLogto(formData: FormData) {
	// Get the return URL from form data
	const returnUrl = formData.get('returnUrl')?.toString() || '/';

	// Store the return URL in a cookie
	(
		await // Store the return URL in a cookie
		cookies()
	).set('logout-return-url', returnUrl, {
		path: '/',
		maxAge: 3600, // 1 hour
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
	});

	await signOut(
		logtoConfig,
		`${process.env.NEXT_PUBLIC_BASE_URL}/logout-callback`,
	);
}
