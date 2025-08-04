'use server';

import { getAccessToken, signOut } from '@logto/next/server-actions';
import { logtoConfig } from '@wpai-chatbot/chat/app/logto';

export async function fetchAccessToken() {
	try {
		return await getAccessToken(logtoConfig);
	} catch (error) {
		await signOut(logtoConfig);
		console.error('Server action error fetching token:', error);
		throw error;
	}
}
