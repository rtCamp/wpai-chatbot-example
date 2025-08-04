'use client';

import { useEffect, useRef, useState } from 'react';
import { safelySplitHtml } from '@wpai-chatbot/chat/lib/html-parser';
import { useChatStore } from '@wpai-chatbot/chat/stores/useChatStore';
import { markdownToHtml } from '@wpai-chatbot/chat/lib/utils';

interface StreamingMessageProps {
	messageId: string;
	className?: string;
}

export function StreamingMessage({
	messageId,
	className,
}: StreamingMessageProps) {
	const {
		updateStreamingContent,
		addStreamingResults,
		completeStreamingMessage,
		streamingContent,
	} = useChatStore();

	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [userScrolledUp, setUserScrolledUp] = useState(false);

	// Custom thinking stages
	const thinkingStages = [
		'Understanding query',
		'Retrieving data',
		'Analyzing data',
		'Finalizing answer',
	];

	// State to track current thinking stage
	const [thinkingStageIndex, setThinkingStageIndex] = useState(0);
	const [, setIsChanging] = useState(false);
	const thinkingTextRef = useRef<HTMLDivElement>(null);

	// Set up thinking stage rotation with animation
	useEffect(() => {
		if (!isLoading) return;

		// Only cycle through once and stay at final stage
		if (thinkingStageIndex >= thinkingStages.length - 1) return;

		const timer = setTimeout(() => {
			// Start transition out
			setIsChanging(true);

			if (thinkingTextRef.current) {
				thinkingTextRef.current.classList.add('placeholder-exit');
			}

			// After exit animation, update text and animate in
			setTimeout(() => {
				setThinkingStageIndex((prev) =>
					Math.min(prev + 1, thinkingStages.length - 1),
				);

				if (thinkingTextRef.current) {
					thinkingTextRef.current.classList.remove(
						'placeholder-exit',
					);
					thinkingTextRef.current.classList.add('placeholder-enter');

					// Remove animation class after it completes
					setTimeout(() => {
						if (thinkingTextRef.current) {
							thinkingTextRef.current.classList.remove(
								'placeholder-enter',
							);
						}
						setIsChanging(false);
					}, 300);
				} else {
					setIsChanging(false);
				}
			}, 300);
		}, 2000);

		return () => clearTimeout(timer);
	}, [thinkingStageIndex, isLoading, thinkingStages.length]);

	// Content buffer for this component instance
	const contentRef = useRef('');
	const isMountedRef = useRef(true);
	const wordQueueRef = useRef<string[]>([]);
	const isProcessingRef = useRef(false);
	const scrollableParentRef = useRef<HTMLElement | null>(null);

	// Process words one at a time with delay for typing effect
	const processQueue = () => {
		if (
			!isMountedRef.current ||
			isProcessingRef.current ||
			wordQueueRef.current.length === 0
		)
			return;

		isProcessingRef.current = true;

		const processNextWord = () => {
			if (!isMountedRef.current || wordQueueRef.current.length === 0) {
				isProcessingRef.current = false;
				return;
			}

			// Get scroll position before adding content
			let shouldScroll = false;
			if (scrollableParentRef.current && !userScrolledUp) {
				const scrollEl = scrollableParentRef.current;
				const atBottom =
					Math.abs(
						scrollEl.scrollHeight -
							scrollEl.scrollTop -
							scrollEl.clientHeight,
					) < 50;
				shouldScroll = atBottom;
			}

			const word = wordQueueRef.current.shift() || '';

			contentRef.current += word;
			updateStreamingContent(messageId, word);

			// Only auto-scroll if we were at the bottom before adding new content
			if (shouldScroll && scrollableParentRef.current) {
				// Use requestAnimationFrame to ensure the DOM has updated before scrolling
				requestAnimationFrame(() => {
					if (scrollableParentRef.current) {
						scrollableParentRef.current.scrollTop =
							scrollableParentRef.current.scrollHeight;
					}
				});
			}

			setTimeout(processNextWord, 30); // Typing speed delay
		};

		processNextWord();
	};

	// Ensure processing continues
	useEffect(() => {
		const checkQueue = () => {
			if (wordQueueRef.current.length > 0 && !isProcessingRef.current) {
				processQueue();
			}

			if (isMountedRef.current) {
				requestAnimationFrame(checkQueue);
			}
		};

		requestAnimationFrame(checkQueue);

		return () => {
			isMountedRef.current = false;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Initialize scroll tracking
	useEffect(() => {
		const findScrollableParent = (
			element: HTMLElement | null,
		): HTMLElement | null => {
			if (!element) return null;

			const parent = element.parentElement;
			if (!parent) return null;

			const isScrollable =
				parent.scrollHeight > parent.clientHeight &&
				(getComputedStyle(parent).overflowY === 'auto' ||
					getComputedStyle(parent).overflowY === 'scroll');

			return isScrollable ? parent : findScrollableParent(parent);
		};

		const messageElement = document.getElementById(`message-${messageId}`);
		scrollableParentRef.current = findScrollableParent(messageElement);

		const handleScroll = () => {
			if (!scrollableParentRef.current) return;

			const scrollEl = scrollableParentRef.current;
			const atBottom =
				Math.abs(
					scrollEl.scrollHeight -
						scrollEl.scrollTop -
						scrollEl.clientHeight,
				) < 50;

			// Only update state if the value changes to avoid unnecessary renders
			if (userScrolledUp === atBottom) {
				setUserScrolledUp(!atBottom);
			}
		};

		if (scrollableParentRef.current) {
			scrollableParentRef.current.addEventListener(
				'scroll',
				handleScroll,
			);
		}

		return () => {
			if (scrollableParentRef.current) {
				scrollableParentRef.current.removeEventListener(
					'scroll',
					handleScroll,
				);
			}
		};
	}, [messageId, userScrolledUp]);

	// Set up streaming
	useEffect(() => {
		isMountedRef.current = true;
		contentRef.current = '';

		const streamUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/messages/${messageId}/stream`;

		const xhr = new XMLHttpRequest();
		xhr.open('GET', streamUrl);
		xhr.setRequestHeader(
			'x-api-key',
			process.env.NEXT_PUBLIC_API_KEY || '',
		);
		xhr.responseType = 'text';

		let lastProcessedIndex = 0;

		xhr.onprogress = () => {
			if (!isMountedRef.current) return;

			try {
				const newText = xhr.responseText.substring(lastProcessedIndex);
				lastProcessedIndex = xhr.responseText.length;

				if (!newText) return;

				const lines = newText.split('\n');

				for (const line of lines) {
					if (!line.trim() || !line.startsWith('data:')) continue;

					try {
						const jsonStr = line.substring(5).trim();
						if (!jsonStr) continue;

						const data = JSON.parse(jsonStr);

						// Handle initialization/progress updates
						if (
							(data.initializing || data.progress) &&
							!data.content
						) {
							continue;
						}

						// Handle content chunks
						if (
							data.content &&
							typeof data.content === 'string' &&
							data.content.trim() !== ''
						) {
							const chunks = safelySplitHtml(data.content);
							chunks.forEach((chunk) =>
								wordQueueRef.current.push(chunk),
							);
						}

						// Store results
						if (data.results && Array.isArray(data.results)) {
							addStreamingResults(messageId, data.results);
						}

						// Handle completion
						if (data.done) {
							const checkComplete = () => {
								if (
									wordQueueRef.current.length === 0 &&
									!isProcessingRef.current
								) {
									if (isMountedRef.current) {
										setIsLoading(false);
										completeStreamingMessage(
											messageId,
											data.type,
										);
									}
								} else {
									requestAnimationFrame(checkComplete);
								}
							};

							requestAnimationFrame(checkComplete);
						}
					} catch (parseErr) {
						console.error(
							'Error parsing SSE data:',
							parseErr,
							line,
						);
					}
				}
			} catch (err) {
				console.error('Error in onprogress handler:', err);
			}
		};

		xhr.onerror = () => {
			console.error('XHR streaming error');
			if (isMountedRef.current) {
				setError('Connection failed. Please try again.');
				setIsLoading(false);
			}
		};

		xhr.onload = () => {
			if (xhr.status !== 200) {
				console.error(`XHR completed with status: ${xhr.status}`);
				if (isMountedRef.current) {
					setError(`Failed to load message (${xhr.status})`);
					setIsLoading(false);
				}
			}
		};

		xhr.send();

		return () => {
			isMountedRef.current = false;
			xhr.abort();
		};
	}, [
		messageId,
		updateStreamingContent,
		addStreamingResults,
		completeStreamingMessage,
	]);

	const content = streamingContent[messageId] || '';

	if (error) {
		return <div className={`text-destructive ${className}`}>{error}</div>;
	}

	return (
		<div id={`message-${messageId}`} className={className}>
			{content ? (
				<div
					className={`message-content ${isLoading ? 'stream-animation' : ''}`}
					dangerouslySetInnerHTML={{
						__html: markdownToHtml(content),
					}}
				/>
			) : (
				<div
					ref={thinkingTextRef}
					className="text-muted-foreground pointer-events-none transition-opacity placeholder-animation thinking-text thinking-animation text-sm"
				>
					{thinkingStages[thinkingStageIndex]}
				</div>
			)}
		</div>
	);
}
