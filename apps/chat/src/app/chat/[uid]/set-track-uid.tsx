'use client';

import { useEffect } from 'react';
import { updateUser } from '@wpai-chatbot/chat/actions/chat';

export default function SetTrackUID({ track_uid }: { track_uid: string }) {
	useEffect(() => {
		if (!track_uid) {
			return;
		}

		if (localStorage.getItem('track_uid') !== track_uid) {
			localStorage.setItem('track_uid', track_uid);
			localStorage.setItem('track_uid_updated_on_backend', 'false');
		}

		if (localStorage.getItem('track_uid_updated_on_backend') != 'true') {
			try {
				const { userId, email } = JSON.parse(
					localStorage.getItem('wpai-chatbotClientInfo') || '{}',
				);
				updateUser({
					id: userId,
					updateUserInfo: {
						track_uid,
						email,
					},
				}).then(() => {
					localStorage.setItem(
						'track_uid_updated_on_backend',
						'true',
					);
				});
			} catch (error) {
				console.error(
					'Error updating user track_uid on backend:',
					error,
				);
			}
		}
	}, [track_uid]);
	return null;
}
