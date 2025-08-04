'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { User } from '@wpai-chatbot/chat/interfaces/user';

import ChatInterfacePage from './chat-interface-page';

export function TokenAuthWrapper({
	token,
	pageUrl,
}: {
	token: string;
	pageUrl: string;
}) {
	const [isValid, setIsValid] = useState(false);
	const [userInfo, setUserInfo] = useState<User | undefined>(undefined);
	const [isLoading, setIsLoading] = useState(true);
	const [, setError] = useState('');
	const [currentToken, setCurrentToken] = useState(token);
	const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
	const router = useRouter();

	const requestTokenRefresh = () => {
		// Send message to parent window requesting token refresh
		if (window.parent !== window) {
			window.parent.postMessage(
				{
					type: 'WPAI_CHATBOT_REQUEST_TOKEN_REFRESH',
				},
				'*',
			);
		}
	};

	const setupRefreshTimer = (expiryTimestamp: number) => {
		if (refreshTimerRef.current) {
			clearTimeout(refreshTimerRef.current);
		}

		const currentTime = Math.floor(Date.now() / 1000);
		const timeUntilExpiry = expiryTimestamp - currentTime;

		// Set refresh to occur 5 minutes before expiration or half the time if less than 10 minutes
		const refreshBuffer =
			timeUntilExpiry > 600 ? 300 : Math.floor(timeUntilExpiry / 2);
		const refreshTime = (timeUntilExpiry - refreshBuffer) * 1000;

		if (refreshTime <= 0) {
			// Token is already expired or about to expire
			requestTokenRefresh();
			return;
		}

		refreshTimerRef.current = setTimeout(
			() => {
				requestTokenRefresh();
			},
			Math.max(refreshTime, 1000),
		);
	};

	useEffect(() => {
		const validateTokenAndGetUserInfo = async () => {
			try {
				localStorage.setItem('accessToken', currentToken);

				const validateResponse = await fetch('/api/validate-token', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ token: currentToken }),
				});

				if (!validateResponse.ok) {
					const errorData = await validateResponse
						.json()
						.catch(() => ({}));
					setError(errorData.error || 'Invalid or expired token');
					setIsValid(false);
					setIsLoading(false);

					// Request a new token from parent window
					requestTokenRefresh();
					return;
				}

				const tokenData = await validateResponse.json();
				setIsValid(true);

				if (tokenData.claims && tokenData.claims.exp) {
					setupRefreshTimer(tokenData.claims.exp);
				}

				// Step 2: Get user info
				const userInfoResponse = await fetch('/api/profile', {
					method: 'GET',
					headers: {
						Authorization: `Bearer ${currentToken}`,
						'Content-Type': 'application/json',
					},
				});

				if (userInfoResponse.ok) {
					const userData = await userInfoResponse.json();
					setUserInfo(userData);
				} else {
					console.error('Failed to fetch user info');
				}
			} catch (error) {
				console.error('Authentication error:', error);
				setError('An error occurred during authentication');
				setIsValid(false);
			} finally {
				setIsLoading(false);
			}
		};

		validateTokenAndGetUserInfo();

		return () => {
			if (refreshTimerRef.current) {
				clearTimeout(refreshTimerRef.current);
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentToken]);

	// Redirect to login if bad token
	useEffect(() => {
		if (!isValid && !isLoading) {
			router.push(window.location.pathname);
		}
	}, [isValid, isLoading, router]);

	// Listen for token refresh messages from parent
	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			if (
				event.data.type === 'WPAI_CHATBOT_TOKEN_REFRESHED' &&
				event.data.token
			) {
				setCurrentToken(event.data.token);
				setIsValid(true);
				setError('');

				// Update URL with new token
				const url = new URL(window.location.href);
				url.searchParams.set('token', event.data.token);
				window.history.replaceState({}, '', url.toString());
			}
		};

		window.addEventListener('message', handleMessage);
		return () => window.removeEventListener('message', handleMessage);
	}, []);

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center w-full bg-background rounded-lg overflow-hidden max-w-[450px] min-h-[500px] h-[100vh] mx-auto gap-4 p-6">
				<Loader2 className="h-4 w-4 animate-spin mx-auto" />
				<p className="text-muted-foreground text-sm">Loading data</p>
			</div>
		);
	}

	return <ChatInterfacePage user={userInfo} pageUrl={pageUrl} />;
}
