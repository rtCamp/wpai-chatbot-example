'use client';

import { useRef } from 'react';
import { Menu } from 'lucide-react';

import { Button } from '../../ui/button';

import { ChatInputNoSession } from './chat-input-no-session';

interface ChatInitialContainerProps {
	onBack: () => void;
	onSendMessage: (clientId: string, message: string) => void;
}

export function ChatInitialContainer({
	onBack,
	onSendMessage,
}: ChatInitialContainerProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	return (
		<div className="flex flex-col h-full" ref={containerRef}>
			<div className="p-4 px-2 border-b flex items-center justify-center relative">
				<Button
					onClick={onBack}
					className="mr-2 cursor-pointer absolute left-2 top-[50%] -translate-y-1/2"
					variant="ghost"
					size="icon"
				>
					<Menu />
				</Button>
				<h2 className="text-md font-semibold flex items-center justify-center">
					<span className="flex mr-2 w-[30px] h-[30px] items-center justify-center rounded-full text-sm bg-black text-white">
						W
					</span>
					WPAI Chatbot
				</h2>
			</div>

			<div className="flex-1 overflow-y-auto p-4 justify-center items-center flex flex-col">
				<p className="flex mr-2 w-[35px] h-[35px] items-center justify-center rounded-full text-sm bg-black text-white">
					W
				</p>
				<h3 className="text-xl font-semibold mt-2 mb-1">
					Hello! I am WPAI Chatbot
				</h3>
				<p className="text-sm text-gray-600">
					How can I help you today?.
				</p>
			</div>

			<div className="p-4 border-t">
				<ChatInputNoSession onSendMessage={onSendMessage} />
			</div>
		</div>
	);
}
