'use client';

import { useEffect } from 'react';

import { fetchAccessToken } from '../actions/server/getLogtoConfig';

export function AuthSuccessNotifier() {
	useEffect(() => {
		const isPopupWindow = window.opener !== null;

		if (isPopupWindow && window.opener !== window.self) {
			const fetchAndSendToken = async () => {
				try {
					const accessToken = await fetchAccessToken();

					// Send token to parent window
					window.opener.postMessage(
						{
							type: 'WPAI_CHATBOT_AUTH_SUCCESS',
							token: accessToken,
						},
						'*',
					);
				} catch (error) {
					console.error('Failed to get access token:', error);
				} finally {
					window.close();
				}
			};

			fetchAndSendToken();
		}
	}, []);

	return null;
}
