import { NextResponse } from 'next/server';
import { getMessagePerUser } from '@wpai-chatbot/chat/lib/get-message-per-user';

export async function GET() {
	return NextResponse.json({ messages_per_user: await getMessagePerUser() });
}
