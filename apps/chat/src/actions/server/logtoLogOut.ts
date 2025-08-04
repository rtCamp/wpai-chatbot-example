'use server';

import { signOut } from '@logto/next/server-actions';
import { logtoConfig } from '@wpai-chatbot/chat/app/logto';

export async function logtoLogOut() {
	await signOut(logtoConfig);
}
