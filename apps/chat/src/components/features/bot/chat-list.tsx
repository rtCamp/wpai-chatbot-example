import { ArrowRight, Loader2, ChevronLeft } from 'lucide-react';
import { Chat } from '@wpai-chatbot/chat/interfaces/message';
import { timeAgo } from '@wpai-chatbot/chat/lib/utils';
import { User } from '@wpai-chatbot/chat/interfaces/user';

import { Button } from '../../ui/button';

interface ChatListProps {
	chats: Chat[];
	onSelectChat: (chat: Chat) => void;
	onNewChat: (clientId: string) => void;
	isLoading: boolean;
	user: User | undefined;
	userName: string | undefined;
	visitInitialState: () => void;
}

export const ChatList = ({
	chats,
	onSelectChat,
	isLoading,
	visitInitialState,
}: ChatListProps) => {
	return (
		<div className="flex flex-col h-full">
			{/* Header */}
			{/* <div className="greeting-container text-white"> */}
			{/* TODO: Handle sign out */}
			{/* <div className="p-4 flex justify-end">
          <SignOutButton />
        </div> */}
			{/* <div className="px-4 py-12">
          <h2 className="font-semibold text-xl">Hey, {username?.split(' ')[0] ?? 'there'} 👋</h2>
          <h3 className="text-md">How can I help you today?</h3>
        </div>
      </div> */}
			<div className="p-4 px-2 border-b flex items-center justify-center relative">
				<Button
					onClick={visitInitialState}
					className="mr-2 cursor-pointer absolute left-2 top-[50%] -translate-y-1/2"
					variant="ghost"
					size="icon"
				>
					<ChevronLeft />
				</Button>
				<h2 className="text-md font-semibold flex items-center justify-center">
					<span className="flex mr-2 w-[30px] h-[30px] items-center justify-center rounded-full text-sm bg-black text-white">
						W
					</span>
					WPAI Chatbot
				</h2>
			</div>

			{/* New Chat Button */}
			<Button
				className="mt-4 mx-4 cursor-pointer text-md font-medium py-4 h-[54px] group"
				onClick={visitInitialState}
			>
				Ask a question{' '}
				<ArrowRight className="ml-2 transition-transform duration-200 group-hover:translate-x-1" />
			</Button>

			{/* Chats List */}
			<div className="flex-1 overflow-y-auto p-4">
				{isLoading ? (
					<div className="py-4 text-center text-muted-foreground">
						<Loader2 className="animate-spin mx-auto" />
					</div>
				) : chats.length === 0 ? (
					<div className="py-4 text-center text-muted-foreground">
						No conversations yet.
					</div>
				) : (
					<div className="space-y-2">
						{chats.map((chat) => (
							<button
								key={chat.id}
								className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer"
								onClick={() => onSelectChat(chat)}
							>
								<div className="font-medium truncate">
									{chat.title}
								</div>
								<div className="text-sm text-muted-foreground flex justify-between mt-1">
									<span className="truncate flex-1">
										{chat.lastMessage.replace(
											/<[^>]*>/g,
											'',
										)}
									</span>
									<span className="text-xs whitespace-nowrap ml-2">
										{timeAgo(new Date(chat.timestamp))}
									</span>
								</div>
							</button>
						))}
					</div>
				)}
			</div>

			{/* Footer with info */}
			<div className="p-4 border-t text-xs text-center text-muted-foreground">
				Made with ❤️ by{' '}
				<a
					href="https://rtcamp.com?utm_source=wpai-chatbot"
					target="_blank"
				>
					rtCamp
				</a>
			</div>
		</div>
	);
};
