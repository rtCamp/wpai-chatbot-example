'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, ArrowUp, X } from 'lucide-react';
import { Button } from '@wpai-chatbot/chat/components/ui/button';
import { Textarea } from '@wpai-chatbot/chat/components/ui/textarea';

interface ChatInputProps {
	onSendMessage: (content: string) => void;
	isLoading: boolean;
	isInitialMessage: boolean;
	setShowPrompt: (value: boolean) => void;
}

export function ChatInput({
	onSendMessage,
	isLoading,
	isInitialMessage,
	setShowPrompt,
}: ChatInputProps) {
	const [input, setInput] = useState('');
	const [placeholderIndex, setPlaceholderIndex] = useState(0);
	const [, setIsChanging] = useState(false);
	const inputRef = useRef<HTMLTextAreaElement>(null);
	const placeholderRef = useRef<HTMLDivElement>(null);
	const [isDisclaimerVisible, setIsDisclaimerVisible] = useState(true);

	const placeholders = [
		'How can rtCamp help with my WordPress project?',
		'Can you migrate my site from custom legacy CMS to WordPress?',
		'How much time does a typical migration project take?',
		'How much does a typical migration project cost?',
	];

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const examplePrompts = [
		'AEM to WordPress migration',
		"rtCamp's history",
		'Timeline of a WordPress development project',
		'Request For Proposal (RFP)',
		'WordPress services',
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

	const handleSend = () => {
		if (input.trim()) {
			setShowPrompt(false);
			onSendMessage(input);
			setInput('');
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			setShowPrompt(false);
			e.preventDefault();
			handleSend();
		}
	};

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const handleExampleClick = (prompt: string) => {
		onSendMessage(prompt);
	};

	// Focus input when component mounts
	useEffect(() => {
		if (inputRef.current) {
			inputRef.current.focus();
		}
	}, []);

	return (
		<div className="space-y-3">
			{/* TODO: Uncomment if you want to have example prompts */}
			{/* {isInitialMessage && (
        <div className="flex flex-wrap gap-2">
          {examplePrompts.map((prompt, index) => (
            <Badge
              key={index}
              variant="outline"
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={() => handleExampleClick(prompt)}
            >
              {prompt}
            </Badge>
          ))}
        </div>
      )} */}

			<div className="flex gap-2 relative items-center">
				<Textarea
					ref={inputRef}
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={handleKeyDown}
					className="min-h-[60px] flex-1 resize-none text-sm align-middle"
					placeholder={isInitialMessage ? '' : 'Reply...'}
				/>
				{input.length === 0 && isInitialMessage && (
					<div
						ref={placeholderRef}
						className="absolute left-3 top-[calc(50%-20px)] text-muted-foreground pointer-events-none transition-opacity placeholder-animation w-[80%] text-sm"
					>
						{placeholders[placeholderIndex]}
					</div>
				)}
				<Button
					onClick={handleSend}
					disabled={isLoading || !input.trim()}
					size="icon"
					className="h-10 w-10"
				>
					{isLoading ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<ArrowUp className="h-4 w-4" />
					)}
				</Button>
			</div>
			{isDisclaimerVisible && isInitialMessage && (
				<div
					className="bg-gray-100 p-2 rounded-sm relative"
					onClick={() => setIsDisclaimerVisible(false)}
				>
					<Button
						className="h-1.5 w-1.5 absolute right-0 top-2"
						variant="ghost"
					>
						<X className="text-gray-400 !h-3" />
					</Button>
					<p className="text-xs text-muted-foreground pr-2">
						The responses are generated using AI and may be
						inaccurate and/or outdated. If there is a problem,
						please report to{' '}
						<a href="mailto:hello@rtcamp.com">hello@rtcamp.com</a>.
					</p>
					<p className="text-xs text-muted-foreground pr-2">
						This site is protected by reCAPTCHA and the Google{' '}
						<a
							target="_blank"
							href="https://policies.google.com/privacy"
						>
							Privacy Policy
						</a>{' '}
						and{' '}
						<a
							target="_blank"
							href="https://policies.google.com/terms"
						>
							Terms of Service
						</a>{' '}
						apply.
					</p>
				</div>
			)}
		</div>
	);
}
