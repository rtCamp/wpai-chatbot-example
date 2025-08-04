// chat-interface.tsx
'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CircleOff, Loader2 } from 'lucide-react';
import { useChatStore } from '@wpai-chatbot/chat/stores/useChatStore';
import { User } from '@wpai-chatbot/chat/interfaces/user';
import { useInIframe } from '@wpai-chatbot/chat/hooks/use-iniframe';

import { ChatList } from './chat-list';
import { ChatContainer } from './chat-container';
import { ChatInitialContainer } from './chat-initial-container';

type ChatInterfaceProps = {
	user: User | undefined;
};

export function ChatInterface({ user }: ChatInterfaceProps) {
	const {
		view,
		chats,
		selectedChat,
		isLoading,
		loadChats,
		selectChat,
		clearSelectedChat,
		createNewChat,
		sendChatMessage,
		deleteSession,
		name,
		visitInitialState,
		sendIntialMessage,
	} = useChatStore(user as User);

	// Check if used in iframe
	const isInIframe = useInIframe();
	const [openedInPopup, setOpenedInPopup] = useState(false);

	// Load chats on mount
	useEffect(() => {
		loadChats();
	}, [loadChats]);

	// Handle iframe height
	useEffect(() => {
		const sendHeightToParent = () => {
			const height = document.body.scrollHeight;
			window.parent.postMessage({ type: 'resize', height }, '*');
		};

		sendHeightToParent();

		// Set up observers to detect height changes
		const resizeObserver = new ResizeObserver(sendHeightToParent);
		resizeObserver.observe(document.body);

		return () => resizeObserver.disconnect();
	}, []);

	useEffect(() => {
		if (typeof window !== 'undefined') {
			const isPopup =
				window.opener !== null && window.opener !== window.self;
			setOpenedInPopup(isPopup);
		}
	}, []);

	// Disallow if not being used in iframe
	if (!isInIframe) {
		return (
			<div className="flex flex-col gap-4 items-center h-[100%] justify-center">
				{openedInPopup ? (
					<Loader2 className="h-8 w-8 animate-spin mx-auto" />
				) : (
					<CircleOff />
				)}
				<p className="text-center">
					{openedInPopup
						? 'Redirecting you to the main site...'
						: 'This page can only be used in an iframe.'}
				</p>
			</div>
		);
	}

	// Loading while user is not populated
	if (isLoading && !user) {
		return (
			<div className="flex flex-col w-full bg-background rounded-lg overflow-hidden max-w-[450px] min-h-[500px] h-[100vh] mx-auto">
				<Loader2 className="animate-spin m-auto" />
			</div>
		);
	}

	return (
		<div className="flex flex-col w-full bg-background rounded-lg overflow-hidden max-w-[450px] min-h-[500px] h-[100vh] mx-auto">
			<AnimatePresence mode="wait">
				{view === 'list' ? (
					<motion.div
						key="list"
						initial={{ opacity: 0, x: -10 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -10 }}
						transition={{ duration: 0.15 }}
						className="h-full"
					>
						<ChatList
							chats={chats}
							onSelectChat={selectChat}
							onNewChat={createNewChat}
							isLoading={isLoading}
							user={user}
							userName={name}
							visitInitialState={visitInitialState}
						/>
					</motion.div>
				) : (
					<motion.div
						key="chat"
						initial={{ opacity: 0, x: 10 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: 10 }}
						transition={{ duration: 0.15 }}
						className="h-full"
					>
						{selectedChat ? (
							<ChatContainer
								chat={selectedChat}
								user={user}
								onBack={clearSelectedChat}
								onSendMessage={sendChatMessage}
								onDeleteSession={deleteSession}
							/>
						) : (
							<ChatInitialContainer
								onBack={clearSelectedChat}
								onSendMessage={sendIntialMessage}
							/>
						)}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
