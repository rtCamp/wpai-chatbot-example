'use client';

import { useState } from 'react';
import { Dialog, DialogContent } from '@wpai-chatbot/chat/components/ui/dialog';
import { Message } from '@wpai-chatbot/chat/interfaces/message';

import { MessageComponent } from './message';

interface MessageListProps {
	messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
	const [selectedMessage, setSelectedMessage] = useState<Message | null>(
		null,
	);

	const handleMessageClick = (message: Message) => {
		setSelectedMessage(message);
	};

	const handleCloseDialog = () => {
		setSelectedMessage(null);
	};

	return (
		<div className="space-y-6">
			{messages.map((message) => (
				<MessageComponent
					key={message.id}
					message={message}
					onClick={() => handleMessageClick(message)}
				/>
			))}

			<Dialog open={!!selectedMessage} onOpenChange={handleCloseDialog}>
				<DialogContent className="max-w-3xl">
					<div className="flex flex-col gap-2">
						<div className="font-medium">
							{selectedMessage?.role === 'user'
								? 'You'
								: 'WPAI_Chatbot'}
						</div>
						<div className="text-sm text-muted-foreground">
							{selectedMessage &&
								new Date(
									selectedMessage.timestamp,
								).toLocaleString()}
						</div>
						<div className="mt-2 whitespace-pre-wrap">
							{selectedMessage?.content}
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
