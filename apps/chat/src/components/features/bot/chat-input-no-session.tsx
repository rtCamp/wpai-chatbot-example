'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowUp } from 'lucide-react';
import { useParams } from 'next/navigation';
import { Textarea } from '@wpai-chatbot/chat/components/ui/textarea';
import { Button } from '@wpai-chatbot/chat/components/ui/button';

interface ChatInputNoSessionProps {
	onSendMessage: (clientId: string, message: string) => void;
}

export function ChatInputNoSession({ onSendMessage }: ChatInputNoSessionProps) {
	const inputRef = useRef<HTMLTextAreaElement>(null);
	const placeholderRef = useRef<HTMLDivElement>(null);
	const [input, setInput] = useState('');
	const [placeholderIndex, setPlaceholderIndex] = useState(0);
	const [, setIsChanging] = useState(false);
	const params = useParams();

	const placeholders = [
		'How can rtCamp help with my WordPress project?',
		'Can you migrate my site from custom legacy CMS to WordPress?',
		'How much time does a typical migration project take?',
		'How much does a typical migration project cost?',
	];

	useEffect(() => {
		const interval = setInterval(() => {
			setIsChanging(true);

			if (placeholderRef.current) {
				placeholderRef.current.classList.add('placeholder-exit');
			}

			setTimeout(() => {
				setPlaceholderIndex(
					(prevIndex) => (prevIndex + 1) % placeholders.length,
				);

				if (placeholderRef.current) {
					placeholderRef.current.classList.remove('placeholder-exit');
					placeholderRef.current.classList.add('placeholder-enter');

					// Remove the animation class after it completes
					setTimeout(() => {
						if (placeholderRef.current) {
							placeholderRef.current.classList.remove(
								'placeholder-enter',
							);
						}
						setIsChanging(false);
					}, 300);
				} else {
					setIsChanging(false);
				}
			}, 300);
		}, 5000);

		return () => clearInterval(interval);
	}, [placeholders.length]);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	const handleSend = () => {
		if (input.trim()) {
			const uidParam = params.uid;
			const uid = Array.isArray(uidParam) ? uidParam[0] : uidParam || '';
			onSendMessage(uid, input);
			setInput('');
		}
	};

	// Focus input when component mounts
	useEffect(() => {
		if (inputRef.current) {
			inputRef.current.focus();
		}
	}, []);

	return (
		<div className="space-y-3">
			<div className="flex gap-2 relative items-center">
				<Textarea
					ref={inputRef}
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={handleKeyDown}
					className="min-h-[60px] flex-1 resize-none text-sm align-middle"
				/>
				{input.length === 0 && (
					<div
						ref={placeholderRef}
						className="absolute left-3 top-[calc(50%-20px)] text-muted-foreground pointer-events-none transition-opacity placeholder-animation w-[80%] text-sm"
					>
						{placeholders[placeholderIndex]}
					</div>
				)}
				<Button
					onClick={handleSend}
					size="icon"
					className="h-10 w-10"
					disabled={!input.trim() || input.length === 0}
				>
					<ArrowUp className="h-4 w-4" />
				</Button>
			</div>
		</div>
	);
}
