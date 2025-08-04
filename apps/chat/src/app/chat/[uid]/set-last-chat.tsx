'use client';

import { useEffect, useRef } from 'react';
import { useChatStore } from '@wpai-chatbot/chat/stores/useChatStore';
import { User } from '@wpai-chatbot/chat/interfaces/user';

export default function SetLastChat({
	user,
	pageUrl,
}: {
	user: User;
	pageUrl: string;
}) {
	const { openChat, createSessionFromSharedChat } = useChatStore(
		user as User,
	);
	const didRun = useRef(false);

	useEffect(() => {
		if (didRun.current) return;
		didRun.current = true;

		if (!pageUrl) {
			return;
		}

		const url = new URL(pageUrl);
		const params = new URLSearchParams(url.search);
		const parameters = Object.fromEntries(params.entries());

		if (
			parameters['utm_source'] &&
			parameters['utm_medium'] &&
			!parameters['shared_chat_id'] &&
			'wpai-chatbot' === parameters['utm_source'] &&
			'referral' === parameters['utm_medium']
		) {
			const lastSelectedChat = localStorage.getItem('lastSelectedChat');
			if (lastSelectedChat) {
				openChat(JSON.parse(lastSelectedChat));
			}
		}

		if (
			parameters['utm_source'] &&
			parameters['utm_medium'] &&
			parameters['shared_chat_id'] &&
			parameters['shared_chat_id'].length > 0 &&
			'wpai-chatbot' === parameters['utm_source'] &&
			'referral' === parameters['utm_medium']
		) {
			createSessionFromSharedChat(user, parameters['shared_chat_id']);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
	return null;
}
