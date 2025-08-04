'use client';

import { IdTokenClaims } from '@logto/next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BotOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { logActivity } from '@wpai-chatbot/chat/actions/crm/salespanel';
import { AuthSuccessNotifier } from '@wpai-chatbot/chat/components/auth-success';
import { ChatInterface } from '@wpai-chatbot/chat/components/features/bot/chat-interface';
import { User } from '@wpai-chatbot/chat/interfaces/user';
import { getTrackUID } from '@wpai-chatbot/chat/lib/utils';
import { logtoLogOut } from '@wpai-chatbot/chat/actions/server/logtoLogOut';

import SetLastChat from './set-last-chat';

const queryClient = new QueryClient();

export default function ChatInterfacePage({
	user,
	claims,
	pageUrl,
}: {
	user?: User;
	claims?: IdTokenClaims;
	pageUrl: string;
}) {
	const router = useRouter();
	const [shouldRedirect, setShouldRedirect] = useState(false);

	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			if (event.data.type === 'show') {
				logActivity(getTrackUID(), 'iframe_open');
			}

			if (event.data.type === 'close') {
				logActivity(getTrackUID(), 'iframe_close');
			}
		};

		window.addEventListener('message', handleMessage);
		return () => window.removeEventListener('message', handleMessage);
	}, []);

	useEffect(() => {
		if (!user && claims) {
			const requiredFields = [
				'sub',
				'email',
				'name',
				'created_at',
			] as const;
			const hasMissingFields = requiredFields.some(
				(field) => !claims?.[field],
			);
			if (hasMissingFields) {
				setShouldRedirect(true);
			}
		}
	}, [user, claims]);

	useEffect(() => {
		if (shouldRedirect) {
			const logOutAndRedirect = async () => {
				try {
					await logtoLogOut();
				} catch (error) {
					console.error('Error logging out:', error);
				} finally {
					router.push(window.location.pathname);
				}
			};

			// Log out the user and redirect to the login page.
			logOutAndRedirect();
		}
	}, [shouldRedirect, router]);

	const finalUser: User = user ?? {
		id: claims?.sub ?? '',
		name: claims?.name ?? '',
		email: claims?.email ?? '',
		primaryEmail: claims?.email ?? '',
		username: claims?.username ?? claims?.name ?? '',
		createdAt: claims?.created_at
			? new Date(Number(claims.created_at)).toISOString()
			: '',
		isActive: true,
	};

	return (
		<>
			<AuthSuccessNotifier />
			<SetLastChat user={finalUser} pageUrl={pageUrl} />
			<QueryClientProvider client={queryClient}>
				{!user && !claims ? (
					<div className="flex flex-col gap-4 items-center h-[100%] justify-center">
						<BotOff />
						<p className="text-center">
							An error occurred while connecting to the service.
						</p>
						<p className="text-muted-foreground">
							<a href="mailto:hello@rtcamp.com">Contact us</a>
						</p>
					</div>
				) : (
					<ChatInterface user={finalUser} />
				)}
			</QueryClientProvider>
		</>
	);
}
