'use client';

import { useRef, useEffect, memo, useState } from 'react';
import { ChevronLeft, EllipsisVertical } from 'lucide-react';
import copy from 'copy-text-to-clipboard';
import { Download, Trash, Copy, CopyCheck } from 'lucide-react';
import sanitizeHtml from 'sanitize-html';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { toast } from 'sonner';
import { Chat } from '@wpai-chatbot/chat/interfaces/message';
import { User } from '@wpai-chatbot/chat/interfaces/user';
import { useChatStore } from '@wpai-chatbot/chat/stores/useChatStore';
import { markdownToHtml } from '@wpai-chatbot/chat/lib/utils';
import { fetchApi } from '@wpai-chatbot/chat/lib/api';
import { Toaster } from '@wpai-chatbot/chat/components/ui/sonner';

import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
} from '../../ui/dropdown-menu';
import { Button } from '../../ui/button';

import { StreamingMessage } from './streaming-message';
import { ChatInput } from './chat-input';

interface ChatContainerProps {
	chat: Chat;
	user: User | undefined;
	onBack: () => void;
	onSendMessage: (content: string) => void;
	onDeleteSession: (chat: Chat) => void;
}

// Memoize StreamingMessage to prevent re-renders
const MemoizedStreamingMessage = memo(StreamingMessage);

export function ChatContainer({
	chat,
	user,
	onBack,
	onSendMessage,
	onDeleteSession,
}: ChatContainerProps) {
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const promptRef = useRef<HTMLDivElement>(null);
	const { thinkingMessageId } = useChatStore();
	const [whiteListedClient, setWhiteListedClient] = useState(
		localStorage.getItem('wpai-chatbotClientInfo')
			? JSON.parse(
					localStorage.getItem('wpai-chatbotClientInfo') as string,
				)
			: null,
	);
	const [chatCount, setChatCount] = useState(
		() => chat.messages.filter((msg) => msg.role === 'user').length,
	);
	/* eslint-disable */
	const [showPrompt, setShowPrompt] = useState(false);
	const [animatedPrompt, setAnimatedPrompt] = useState('');
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [emailSubmitSuccess, setEmailSubmitSuccess] =
		useState('notSubmitted');
	/* eslint-enable */
	const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
	const [chatThreshold, setChatThreshold] = useState(3);
	const [isCopyingLink, setIsCopyingLink] = useState(false);

	useEffect(() => {
		const populateFreeMessageThreshold = async () => {
			const response = await fetch('/api/get-free-message-count');

			if (response.ok) {
				const data = await response.json();
				setChatThreshold(data.messages_per_user);
			}
		};

		populateFreeMessageThreshold();
	}, []);

	// Scroll to bottom when messages change
	useEffect(() => {
		if (messagesEndRef.current) {
			messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
		}
		setChatCount(chat.messages.filter((msg) => msg.role === 'user').length);
	}, [chat.messages]);

	useEffect(() => {
		const lastMsg = chat.messages[chat.messages.length - 1];

		if (
			whiteListedClient &&
			!whiteListedClient.email &&
			chatCount >= chatThreshold &&
			lastMsg?.role === 'assistant' &&
			!lastMsg.isThinking &&
			!lastMsg.isStreaming
		) {
			const timeout = setTimeout(() => {
				const fullText =
					"Hey! We'd love to personalize your experience. Could you share your name and email to proceed further?";
				let currentIndex = 0;

				setAnimatedPrompt('');
				setShowPrompt(true);

				const interval = setInterval(() => {
					currentIndex++;
					setAnimatedPrompt(fullText.slice(0, currentIndex));

					if (promptRef.current) {
						promptRef.current.scrollIntoView({
							behavior: 'smooth',
						});
					}

					if (currentIndex === fullText.length) {
						clearInterval(interval);
					}
				}, 25);
			}, 1000);

			return () => clearTimeout(timeout);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [chat.messages, chatCount, whiteListedClient]);

	useEffect(() => {
		if (emailSubmitSuccess) {
			const clientInfo = localStorage.getItem('wpai-chatbotClientInfo');
			if (clientInfo && email.length > 0) {
				const newClientInfo = JSON.parse(clientInfo);
				newClientInfo.email = email;
				newClientInfo.name =
					name.length > 0 ? name : email.split('@')[0];
				localStorage.setItem(
					'wpai-chatbotClientInfo',
					JSON.stringify(newClientInfo),
				);
				setWhiteListedClient(newClientInfo);
			}

			messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [emailSubmitSuccess]);

	const handleCopy = async (messageId: string, message: string) => {
		try {
			if (message) {
				// Find the index of current message
				const currentIndex = chat.messages.findIndex(
					(msg) => msg.id === messageId,
				);

				// Get the previous user message if it exists
				let textToCopy = '';
				if (currentIndex > 0) {
					const previousMessage = chat.messages[currentIndex - 1];
					if (previousMessage.role === 'user') {
						const cleanPrevMessage = sanitizeHtml(
							previousMessage.content,
							{
								allowedTags: ['a'],
							},
						);
						textToCopy = `# User: \n\n${cleanPrevMessage}\n\n\n# Assistant: \n\n`;
					}
				}

				// Add current message
				const cleanMessage = sanitizeHtml(message, {
					allowedTags: ['a'],
				});
				textToCopy += cleanMessage;

				// Replace related source links with markdown format
				textToCopy = textToCopy.replace(
					/<a[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gi,
					'[$2]($1)',
				);

				// Add timestamp
				const timeString = new Date(
					chat.messages[currentIndex].timestamp,
				).toUTCString();
				textToCopy = `>Timestamp: ${timeString}\n\n` + textToCopy;

				await copyToClipboard(textToCopy);
				setCopiedMessageId(messageId);
				setTimeout(() => setCopiedMessageId(null), 3000);
			}
		} catch (err) {
			console.error('Failed to copy message:', err);
		}
	};

	const copyToClipboard = async (text: string) => {
		copy(text);

		if (navigator.clipboard && window.isSecureContext) {
			// Modern API.
			await navigator.clipboard.writeText(text).catch((err) => {
				console.error('Clipboard API failed', err);
			});
		} else {
			// Fallback for older browser.
			const textArea = document.createElement('textarea');
			textArea.value = text;
			textArea.style.position = 'fixed';
			textArea.style.opacity = '0';
			document.body.appendChild(textArea);
			textArea.focus();
			textArea.select();

			try {
				document.execCommand('copy');
			} catch (err) {
				console.error('execCommand fallback failed', err);
			}

			document.body.removeChild(textArea);
		}
	};

	const exportChat = async () => {
		if (!chat || !chat.messages) return;

		function textToTextRuns(text: string): TextRun[] {
			const lines = text.split(/\n+/);
			return lines.flatMap((line, i) => {
				const runs = [new TextRun({ text: line })];
				if (i < lines.length - 1) {
					runs.push(new TextRun({ break: 1 }));
				}
				return runs;
			});
		}

		const doc = new Document({
			sections: [
				{
					properties: {},
					children: chat.messages.map((message) => {
						const timestamp = new Date(message.timestamp)
							.toISOString()
							.replace('T', ' ')
							.slice(0, 19);
						const role =
							message.role === 'user'
								? user?.name
									? user.name
									: 'User'
								: 'WPAI_Chatbot';

						return new Paragraph({
							children: [
								new TextRun({
									text: `${role}:`,
									bold: true,
								}),
								...textToTextRuns(
									sanitizeHtml(message.content, {
										allowedTags: ['a'],
									}),
								),
								new TextRun({
									text: `\nTimestamp: ${timestamp}`,
									break: 1,
									bold: true,
									size: 20,
								}),
							],
							spacing: { after: 300 },
						});
					}),
				},
			],
		});

		const blob = await Packer.toBlob(doc);
		const url = URL.createObjectURL(blob);

		const link = document.createElement('a');
		link.href = url;
		link.download = `${chat.title}_chat_export.docx`;
		link.click();

		URL.revokeObjectURL(url);
	};

	const copyChatLink = async () => {
		try {
			setIsCopyingLink(true);

			// 1. Create shared chat
			const { id: sharedChatId } = await fetchApi('/shared-chat', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					sessionId: chat.id,
				}),
			});

			// 2. Create shareable link
			const baseUrl = new URL(
				localStorage.getItem('pageUrl') || window.location.origin,
			);
			baseUrl.searchParams.set('utm_source', 'wpai-chatbot');
			baseUrl.searchParams.set('utm_medium', 'referral');
			baseUrl.searchParams.set('shared_chat_id', sharedChatId);
			const chatLink = baseUrl.toString();

			// 3. Copy to clipboard
			setTimeout(async () => {
				await copyToClipboard(chatLink);
				toast('Chat link copied to clipboard', {
					style: {
						backgroundColor: '#4ade80',
						color: '#1f2937',
					},
					duration: 4000,
				});
			}, 0);
		} catch (error) {
			console.error('Failed to create and copy chat link:', error);
			toast('Failed to create and copy chat link', {
				style: {
					backgroundColor: '#f87171',
					color: '#1f2937',
				},
				duration: 4000,
			});
		} finally {
			setIsCopyingLink(false);
		}
	};

	return (
		<div className="flex flex-col h-full" ref={containerRef}>
			<div className="p-4 px-2 border-b flex items-center gap-1">
				<Button
					onClick={onBack}
					className="mr-2 cursor-pointer"
					variant="ghost"
					size="icon"
				>
					<ChevronLeft />
				</Button>
				<h2 className="font-medium text-sm truncate grow">
					{chat.title}
				</h2>
				{/* TODO: Add chat deletion option */}
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" size="icon">
							<EllipsisVertical className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent className="w-56">
						<DropdownMenuItem
							className="w-full"
							onSelect={(e) => e.preventDefault()}
						>
							<Button
								variant="outline"
								className="w-full"
								onClick={copyChatLink}
								disabled={isCopyingLink}
							>
								{isCopyingLink
									? 'Copying link...'
									: 'Share chat'}{' '}
								<Copy className="ml-2" />
							</Button>
						</DropdownMenuItem>
						<DropdownMenuItem className="w-full">
							<Button
								variant="outline"
								className="w-full"
								onClick={exportChat}
							>
								Export chat <Download className="ml-2" />
							</Button>
						</DropdownMenuItem>
						<DropdownMenuItem className="w-full">
							<Button
								variant="destructive"
								className="w-full"
								onClick={() => {
									onDeleteSession(chat);
								}}
							>
								Delete chat{' '}
								<Trash className="ml-2" color="white" />
							</Button>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			<div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
				{chat.messages.map((message, index) => (
					<div
						id={`message-${message.id}`}
						key={`${message.id}-${message.role}-${index}`}
						className={`flex relative ${message.role === 'user' ? 'justify-end' : 'flex-col justify-start items-start'}`}
					>
						<div
							className={`max-w-[80%] min-w-[80%] p-3 rounded-lg ${
								message.role === 'user'
									? 'bg-primary text-primary-foreground'
									: message.isThinking
										? 'bg-muted text-muted-foreground thinking-animation'
										: message.isError
											? 'bg-destructive/10 text-destructive'
											: 'bg-muted text-foreground'
							}`}
						>
							{message.isStreaming ? (
								<MemoizedStreamingMessage
									key={`stream-${message.id}`}
									messageId={message.id}
								/>
							) : (
								<div
									className={`message-content ${message.role === 'assistant' && !message.isThinking && !message.isStreaming ? 'pb-[30px]' : ''}`}
									dangerouslySetInnerHTML={{
										__html: markdownToHtml(
											message.role === 'assistant' &&
												!message.isThinking &&
												!message.isStreaming
												? message.content +
														'<hr class="mt-4">'
												: message.content,
										),
									}}
								/>
							)}
						</div>
						{message.role === 'assistant' &&
							!message.isThinking &&
							!message.isStreaming && (
								<div
									className="flex justify-start mt-2 absolute bottom-3 left-3 cursor-pointer"
									onClick={() =>
										handleCopy(message.id, message.content)
									}
								>
									{copiedMessageId !== message.id ? (
										<>
											<Copy className="ml-1 h-4 w-4 text-foreground cursor-pointer" />
											<span className="text-foreground text-xs block ml-2">
												Copy
											</span>
										</>
									) : (
										<>
											<CopyCheck className="ml-1 h-4 w-4 text-foreground" />
											<span className="text-foreground text-xs block ml-2">
												Copied
											</span>
										</>
									)}
								</div>
							)}
					</div>
				))}
				{/* Empty div to scroll to the bottom */}
				<div ref={messagesEndRef} />
			</div>

			<div className="p-4 border-t">
				<ChatInput
					onSendMessage={onSendMessage}
					isLoading={!!thinkingMessageId}
					isInitialMessage={chat.messages.length === 1}
					setShowPrompt={setShowPrompt}
				/>
			</div>

			<Toaster />
		</div>
	);
}
