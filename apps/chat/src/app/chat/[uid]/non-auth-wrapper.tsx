'use client';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { User } from '@wpai-chatbot/chat/interfaces/user';
import { generateUUID } from '@wpai-chatbot/chat/lib/utils';
import blackListedCountryCode from '@wpai-chatbot/chat/constants/blacklisted-country';

import ChatInterfacePage from './chat-interface-page';

export default function AuthGate({ pageUrl }: { pageUrl: string }) {
	const [countryCode, setCountryCode] = useState<string>('');
	const [repeatUser, setRepeatUser] = useState<{
		userId: string;
		countryCode: string | null;
		email?: string;
		name?: string | null;
	} | null>(null);

	useEffect(() => {
		const storedUser = localStorage.getItem('wpai-chatbotClientInfo');

		const fetchCountry = async () => {
			try {
				let locationDataRaw = await fetch('/api/get-country');

				if (!locationDataRaw.ok) {
					// Fallback, incase X-REAL-IP is not set my default by NGINX server.
					const ipRes = await fetch(
						'https://api.ipify.org?format=json',
					);
					const ipJson = await ipRes.json();
					locationDataRaw = await fetch('/api/get-country', {
						method: 'GET',
						headers: {
							'X-REAL-IP': ipJson.ip,
						},
					});

					if (!locationDataRaw.ok) {
						throw new Error('Failed to get country');
					}
				}
				const locationData = await locationDataRaw.json();
				setCountryCode(locationData.country?.toUpperCase() || null);
			} catch (error) {
				console.error('Geo lookup failed:', error);
			}
		};

		if (storedUser) {
			setRepeatUser(JSON.parse(storedUser));
		} else {
			fetchCountry();
		}
	}, []);

	if (
		repeatUser &&
		repeatUser.countryCode &&
		!Object.prototype.hasOwnProperty.call(
			blackListedCountryCode,
			repeatUser.countryCode,
		)
	) {
		const client: User = {
			id: repeatUser.userId,
			email: repeatUser.email ?? `${repeatUser.userId}@guest.local`,
			name: repeatUser.name ?? 'no-name',
			createdAt: new Date().toISOString(),
			isActive: true,
		};

		return <ChatInterfacePage user={client} pageUrl={pageUrl} />;
	}

	if (
		countryCode &&
		!Object.prototype.hasOwnProperty.call(
			blackListedCountryCode,
			countryCode,
		)
	) {
		let userId;

		if (repeatUser) {
			userId = repeatUser.userId;
		} else {
			userId = generateUUID();
			localStorage.setItem(
				'wpai-chatbotClientInfo',
				JSON.stringify({ userId, countryCode }),
			);
		}

		const client: User = {
			id: userId,
			email: `${userId}@guest.local`,
			createdAt: new Date().toISOString(),
			isActive: true,
		};

		return <ChatInterfacePage user={client} pageUrl={pageUrl} />;
	}

	// Todo: Add loader while code cleanup.
	return (
		<div className="flex flex-col items-center justify-center w-full bg-background rounded-lg overflow-hidden max-w-[450px] min-h-[500px] h-[100vh] mx-auto gap-4 p-6">
			<Loader2 className="animate-spin" />
		</div>
	);
}
