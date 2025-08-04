import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from '@wpai-chatbot/chat/components/ui/avatar';
import { Message } from '@wpai-chatbot/chat/interfaces/message';
import { cn } from '@wpai-chatbot/chat/lib/utils';

interface MessageProps {
	message: Message;
	onClick: () => void;
}

export function MessageComponent({ message, onClick }: MessageProps) {
	// Don't show system messages
	if (message.role === 'system') {
		return (
			<div className="text-center text-sm text-muted-foreground py-2">
				{message.content}
			</div>
		);
	}

	return (
		<div
			className={cn(
				'flex items-start gap-3 group cursor-pointer p-2 rounded-md hover:bg-muted/50 transition-colors',
				message.role === 'user' ? 'justify-end' : '',
			)}
			onClick={onClick}
		>
			{message.role !== 'user' && (
				<Avatar className="h-8 w-8">
					<AvatarImage src="/bot-avatar.png" alt="WPAI_Chatbot" />
					<AvatarFallback className="bg-primary/10 text-primary text-xs">
						DS
					</AvatarFallback>
				</Avatar>
			)}

			<div
				className={cn(
					'flex flex-col gap-1 max-w-[80%]',
					message.role === 'user' ? 'items-end' : 'items-start',
				)}
			>
				<div
					className={cn(
						'px-3 py-2 rounded-lg text-sm',
						message.role === 'user'
							? 'bg-primary text-primary-foreground'
							: 'bg-muted',
					)}
				>
					{message.content}
				</div>
				<div className="text-xs text-muted-foreground">
					{new Date(message.timestamp).toLocaleTimeString([], {
						hour: '2-digit',
						minute: '2-digit',
					})}
				</div>
			</div>

			{message.role === 'user' && (
				<Avatar className="h-8 w-8">
					<AvatarImage src="/user-avatar.png" alt="You" />
					<AvatarFallback className="bg-secondary/10 text-secondary text-xs">
						You
					</AvatarFallback>
				</Avatar>
			)}
		</div>
	);
}
