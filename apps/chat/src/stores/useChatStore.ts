// stores/useChatStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Chat, Message } from '@wpai-chatbot/chat/interfaces/message';
import { RetrievalResponse } from '@wpai-chatbot/chat/interfaces/retrieval';
import {
	fetchSessions,
	fetchChatMessages,
	createSession,
	sendMessage,
	deleteSession,
	updateUser,
	searchResult,
	sessionFromSharedChat,
} from '@wpai-chatbot/chat/actions/chat';

import { User } from '../interfaces/user';
import { getCaptchaToken, getTrackUID } from '../lib/utils';
import { logActivity } from '../actions/crm/salespanel';

let activeStoreId: string | null = null;

// Define the ChatState interface with userId
interface ChatState {
	// UI state
	view: 'list' | 'chat';
	isLoading: boolean;
	userId: string;
	email: string;
	name: string;

	// Data
	chats: Chat[];
	selectedChat: Chat | null;

	// Message processing state
	thinkingMessageId: string | null;
	thinkingStage: number;
	lastUserContent: string;
	streamingContent: Record<string, string>;
	streamingResults: Record<string, RetrievalResponse[]>;

	// Thinking stages
	thinkingStages: string[];

	// Interval management
	intervalId: number | null;

	// Actions
	setView: (view: 'list' | 'chat') => void;
	loadChats: () => Promise<void>;
	selectChat: (chat: Chat) => void;
	deleteSession: (chat: Chat) => void;
	updateUserInfo: (email: string, name: string) => void;
	clearSelectedChat: () => void;
	createNewChat: (clientId: string) => Promise<void>;
	sendChatMessage: (content: string) => Promise<void>;
	updateThinkingStage: () => void;
	updateStreamingContent: (messageId: string, content: string) => void;
	addStreamingResults: (
		messageId: string,
		results: RetrievalResponse[],
	) => void;
	completeStreamingMessage: (messageId: string, messageType: string) => void;
	clearThinkingInterval: () => void;
	openChat: (chat: Chat) => void;
	visitInitialState: () => void;
	sendIntialMessage: (clientId: string, content: string) => Promise<void>;
	createSessionFromSharedChat: (
		user: User,
		sharedChatId: string,
	) => Promise<void>;
}

const THINKING_STAGES = [
	'Understanding query',
	'Retrieving information',
	'Analyzing data',
	'Formulating response',
];

// Function to create store instance with user
export const createChatStore = (user: User) => {
	return create<ChatState>()(
		devtools(
			persist(
				(set, get) => ({
					// UI state
					view: 'chat',
					isLoading: false,
					userId: user.id,
					email: user.email ?? 'no-email',
					name: user.name ?? 'no-name',

					// Data
					chats: [],
					selectedChat: null,

					// Message processing state
					thinkingMessageId: null,
					thinkingStage: 0,
					lastUserContent: '',
					streamingContent: {},
					streamingResults: {},

					// Thinking stages
					thinkingStages: THINKING_STAGES,

					// Interval management
					intervalId: null,

					// Clear thinking interval
					clearThinkingInterval: () => {
						const intervalId = get().intervalId;
						if (intervalId) {
							window.clearInterval(intervalId);
							set({ intervalId: null });
						}
					},

					// UI navigation
					setView: (view) => set({ view }),

					// Loading chats with userId
					loadChats: async () => {
						set({ isLoading: true });
						try {
							const chats: Chat[] =
								(await fetchSessions(user.id)) ?? []; // Pass userId
							set({ chats, isLoading: false });
						} catch (error) {
							console.error('Failed to load chats:', error);
							set({ isLoading: false });
						}
					},

					// Select a chat and load its messages
					selectChat: async (chat) => {
						set({ selectedChat: chat, view: 'chat' });

						try {
							const messages = await fetchChatMessages(chat.id);
							localStorage.setItem(
								'lastSelectedChat',
								JSON.stringify({
									...chat,
									messages,
								}),
							);
							set((state) => ({
								selectedChat: state.selectedChat
									? {
											...state.selectedChat,
											messages,
										}
									: null,
							}));
						} catch (error) {
							console.error('Failed to load messages:', error);
						}
					},

					// Update user information.
					updateUserInfo: async (email: string, name: string) => {
						set({ email, name });
						try {
							const updateUserInfo = {
								name: name ?? 'no-name',
								email: email ?? 'no-email',
							};
							await updateUser({ id: user.id, updateUserInfo });
						} catch (error) {
							console.error('Failed to update user info:', error);
						}
					},

					//  Deletes a chat session.
					deleteSession: async (chat) => {
						const prevState = get();

						set((state) => {
							const isDeletedChatSelected =
								state.selectedChat?.id === chat.id;
							localStorage.removeItem('lastSelectedChat');

							return {
								chats: state.chats.filter(
									(currentChat) => currentChat.id !== chat.id,
								),
								selectedChat: isDeletedChatSelected
									? null
									: state.selectedChat,
								view: isDeletedChatSelected
									? 'list'
									: state.view,
								thinkingMessageId: isDeletedChatSelected
									? null
									: state.thinkingMessageId,
								lastUserContent: isDeletedChatSelected
									? ''
									: state.lastUserContent,
							};
						});
						for (let attempt = 1; attempt <= 3; attempt++) {
							try {
								await deleteSession(chat.id);

								return;
							} catch (error) {
								if (attempt === 3) {
									console.error(
										'Chat deletion failed, rolling back:',
										error,
									);

									set(prevState);
								}
							}
						}
					},

					// Clear selected chat
					clearSelectedChat: () => {
						// Update title in chats list if needed
						const {
							selectedChat,
							lastUserContent,
							chats,
							clearThinkingInterval,
						} = get();

						// Clear any active thinking interval
						clearThinkingInterval();

						if (
							selectedChat &&
							lastUserContent &&
							selectedChat.title === 'New Conversation'
						) {
							const title =
								lastUserContent.substring(0, 30) +
								(lastUserContent.length > 30 ? '...' : '');

							const updatedChats = chats.map((chat) =>
								chat.id === selectedChat.id
									? { ...chat, title }
									: chat,
							);

							set({ chats: updatedChats });
						}

						set({
							selectedChat: null,
							view: 'list',
							thinkingMessageId: null,
							lastUserContent: '',
						});
					},

					visitInitialState: () => {
						const { view } = get();
						// If the view is not 'chat', set it to 'chat'
						if (view !== 'chat') {
							set({
								view: 'chat',
								selectedChat: null,
								thinkingMessageId: null,
								lastUserContent: '',
							});
						}
					},

					// Create new chat with userId
					createNewChat: async (clientId: string) => {
						try {
							const newSession = await createSession({
								userId: get().userId,
								name: get().name,
								email: get().email,
								userTimeZone:
									Intl.DateTimeFormat().resolvedOptions()
										.timeZone,
								clientId: clientId,
							});

							const newChat: Chat = {
								id: newSession.id,
								title: 'New Conversation',
								lastMessage: '',
								timestamp: newSession.createdAt,
								messages: [
									{
										id: 'welcome-' + Date.now(),
										role: 'system',
										content:
											'Ask me anything about our work, our WordPress expertise, and anything in between!',
										timestamp: new Date().toISOString(),
									},
								],
							};

							localStorage.setItem(
								'lastSelectedChat',
								JSON.stringify(newChat),
							);

							set((state) => ({
								chats: [newChat, ...state.chats],
								selectedChat: newChat,
								view: 'chat',
							}));
						} catch (error) {
							console.error('Failed to create new chat:', error);
						}
					},

					// Send a message with userId
					sendChatMessage: async (content) => {
						const { selectedChat, clearThinkingInterval } = get();
						if (!selectedChat) return;

						// Clear any existing interval first
						clearThinkingInterval();

						// Save user content for potential title update
						set({ lastUserContent: content });

						// Create user message
						const userMessage: Message = {
							id: `temp-user-${Date.now()}`,
							role: 'user',
							content,
							timestamp: new Date().toISOString(),
						};

						// Create thinking message
						const thinkingId = `thinking-${Date.now()}`;
						const thinkingMessage: Message = {
							id: thinkingId,
							role: 'assistant',
							content: THINKING_STAGES[0],
							timestamp: new Date().toISOString(),
							isThinking: true,
						};

						// Current timestamp for ordering
						const currentTimestamp = new Date().toISOString();

						// Update UI with both messages and move current chat to top
						set((state) => {
							if (!state.selectedChat) return state;

							// Update selected chat with new messages
							const updatedSelectedChat = {
								...state.selectedChat,
								messages: [
									...state.selectedChat.messages,
									userMessage,
									thinkingMessage,
								],
								timestamp: currentTimestamp, // Update timestamp
							};

							// Update the chat in the chats list and reorder
							const updatedChats = state.chats.map((chat) =>
								chat.id === updatedSelectedChat.id
									? updatedSelectedChat
									: chat,
							);

							// Sort chats by timestamp, newest first
							const sortedChats = [...updatedChats].sort(
								(a, b) =>
									new Date(b.timestamp).getTime() -
									new Date(a.timestamp).getTime(),
							);

							localStorage.setItem(
								'lastSelectedChat',
								JSON.stringify(updatedSelectedChat),
							);

							return {
								selectedChat: updatedSelectedChat,
								chats: sortedChats,
								thinkingMessageId: thinkingId,
								thinkingStage: 0,
							};
						});

						// Setup thinking rotation with browser-native window.setInterval
						// This ensures the interval runs even if React state updates are delayed
						const interval = window.setInterval(() => {
							const state = get();
							if (!state.thinkingMessageId) {
								window.clearInterval(interval);
								return;
							}

							const nextStage =
								(state.thinkingStage + 1) %
								THINKING_STAGES.length;

							set((state) => {
								if (
									!state.selectedChat ||
									!state.thinkingMessageId
								)
									return state;

								return {
									thinkingStage: nextStage,
									selectedChat: {
										...state.selectedChat,
										messages:
											state.selectedChat.messages.map(
												(msg) =>
													msg.id ===
													state.thinkingMessageId
														? {
																...msg,
																content:
																	THINKING_STAGES[
																		nextStage
																	],
															}
														: msg,
											),
									},
								};
							});
						}, 2000);

						// Store interval ID for cleanup
						set({ intervalId: interval as unknown as number });

						try {
							// Send message to API with userId
							const captchaToken =
								await getCaptchaToken('send_message');

							if (!captchaToken) {
								throw new Error(
									'Failed to generate captcha token',
								);
							}

							const currentPageUrl =
								localStorage.getItem('pageUrl') || '';

							const response = await sendMessage(
								selectedChat.id,
								content,
								captchaToken,
								currentPageUrl,
							);
							const messageId = response.id;

							// Clear thinking interval
							clearThinkingInterval();

							// Replace thinking message with streaming message
							set((state) => {
								if (!state.selectedChat) return state;

								const updatedMessages =
									state.selectedChat.messages.map((msg) =>
										msg.id === thinkingId
											? {
													id: messageId,
													role: 'assistant',
													content: '',
													timestamp:
														new Date().toISOString(),
													isThinking: false,
													isStreaming: true,
												}
											: msg,
									);

								return {
									selectedChat: {
										...state.selectedChat,
										messages: updatedMessages ?? [],
									},
									thinkingMessageId: null,
									streamingContent: {
										...state.streamingContent,
										[messageId]: '',
									},
								};
							});
						} catch (error) {
							// Clear thinking interval
							clearThinkingInterval();

							// Show error message
							set((state) => {
								if (!state.selectedChat) return state;

								const errorMessage: Message = {
									id: `error-${Date.now()}`,
									role: 'assistant',
									content:
										'Sorry, I encountered an error processing your request.',
									timestamp: new Date().toISOString(),
									isError: true,
								};

								const updatedMessages =
									state.selectedChat.messages
										.filter((msg) => msg.id !== thinkingId)
										.concat(errorMessage);

								return {
									selectedChat: {
										...state.selectedChat,
										messages: updatedMessages,
									},
									thinkingMessageId: null,
								};
							});

							console.error('Failed to send message:', error);
						}
					},

					sendIntialMessage: async (clientId, content) => {
						const { clearThinkingInterval } = get();
						let currentChat: Chat | null = null;

						// Create user message.
						const userMessage: Message = {
							id: `temp-user-${Date.now()}`,
							role: 'user',
							content,
							timestamp: new Date().toISOString(),
						};

						// Create thinking message
						const thinkingId = `thinking-${Date.now()}`;
						const thinkingMessage: Message = {
							id: thinkingId,
							role: 'assistant',
							content: THINKING_STAGES[0],
							timestamp: new Date().toISOString(),
							isThinking: true,
						};

						try {
							const newSession = await createSession({
								userId: get().userId,
								name: get().name,
								email: get().email,
								userTimeZone:
									Intl.DateTimeFormat().resolvedOptions()
										.timeZone,
								clientId: clientId,
							});

							clearThinkingInterval();

							set({ lastUserContent: content });

							const newChat: Chat = {
								id: newSession.id,
								title: 'New Conversation',
								lastMessage: '',
								timestamp: newSession.createdAt,
								messages: [userMessage, thinkingMessage],
							};

							currentChat = newChat;

							set((state) => {
								// Update the chat in the chats list and reorder
								const updatedChats = [newChat, ...state.chats];

								// Sort chats by timestamp, newest first
								const sortedChats = [...updatedChats].sort(
									(a, b) =>
										new Date(b.timestamp).getTime() -
										new Date(a.timestamp).getTime(),
								);

								return {
									selectedChat: newChat,
									chats: sortedChats,
									thinkingMessageId: thinkingId,
									thinkingStage: 0,
								};
							});

							// Setup thinking rotation with browser-native window.setInterval
							// This ensures the interval runs even if React state updates are delayed
							const interval = window.setInterval(() => {
								const state = get();
								if (!state.thinkingMessageId) {
									window.clearInterval(interval);
									return;
								}

								const nextStage =
									(state.thinkingStage + 1) %
									THINKING_STAGES.length;

								set((state) => {
									if (
										!state.selectedChat ||
										!state.thinkingMessageId
									)
										return state;

									return {
										thinkingStage: nextStage,
										selectedChat: {
											...state.selectedChat,
											messages:
												state.selectedChat.messages.map(
													(msg) =>
														msg.id ===
														state.thinkingMessageId
															? {
																	...msg,
																	content:
																		THINKING_STAGES[
																			nextStage
																		],
																}
															: msg,
												),
										},
									};
								});
							}, 2000);

							// Store interval ID for cleanup
							set({ intervalId: interval as unknown as number });

							// Send message to API with userId
							const captchaToken =
								await getCaptchaToken('send_message');

							if (!captchaToken) {
								throw new Error(
									'Failed to generate captcha token',
								);
							}

							const currentPageUrl =
								localStorage.getItem('pageUrl') || '';

							const response = await sendMessage(
								newChat.id,
								content,
								captchaToken,
								currentPageUrl,
							);
							const messageId = response.id;

							// Clear thinking interval
							clearThinkingInterval();

							// Replace thinking message with streaming message
							set((state) => {
								const updatedMessages = newChat.messages.map(
									(msg) =>
										msg.id === thinkingId
											? {
													id: messageId,
													role: 'assistant',
													content: '',
													timestamp:
														new Date().toISOString(),
													isThinking: false,
													isStreaming: true,
												}
											: msg,
								);

								localStorage.setItem(
									'lastSelectedChat',
									JSON.stringify({
										...newChat,
										messages: updatedMessages,
									}),
								);

								return {
									selectedChat: {
										...newChat,
										messages: updatedMessages,
									},
									thinkingMessageId: null,
									streamingContent: {
										...state.streamingContent,
										[messageId]: '',
									},
								};
							});
						} catch (error) {
							// Clear thinking interval
							clearThinkingInterval();

							// Show error message.
							const errorMessage: Message = {
								id: `error-${Date.now()}`,
								role: 'assistant',
								content:
									'Sorry, I encountered an error processing your request.',
								timestamp: new Date().toISOString(),
								isError: true,
							};

							const updatedMessages = currentChat?.messages
								.filter((msg) => msg.id !== thinkingId)
								.concat(errorMessage);

							set({
								selectedChat: currentChat
									? {
											id: currentChat.id ?? '',
											title:
												currentChat.title ??
												'New Conversation',
											lastMessage:
												currentChat.lastMessage ?? '',
											timestamp:
												currentChat.timestamp ??
												new Date().toISOString(),
											messages: updatedMessages ?? [],
										}
									: null,
								thinkingMessageId: null,
							});
							console.error(
								'Failed to send initial message:',
								error,
							);
						}
					},

					// Update thinking stage
					updateThinkingStage: () => {
						set((state) => {
							const {
								thinkingMessageId,
								thinkingStage,
								selectedChat,
								thinkingStages,
							} = state;

							if (!thinkingMessageId || !selectedChat)
								return state;

							const nextStage =
								(thinkingStage + 1) % thinkingStages.length;

							const updatedMessages = selectedChat.messages.map(
								(msg) =>
									msg.id === thinkingMessageId
										? {
												...msg,
												content:
													thinkingStages[nextStage],
											}
										: msg,
							);

							return {
								thinkingStage: nextStage,
								selectedChat: {
									...selectedChat,
									messages: updatedMessages,
								},
							};
						});
					},

					// Update streaming content
					updateStreamingContent: (messageId, content) => {
						set((state) => ({
							streamingContent: {
								...state.streamingContent,
								[messageId]:
									(state.streamingContent[messageId] || '') +
									content,
							},
						}));
					},

					// Add streaming results
					addStreamingResults: (messageId, results) => {
						set((state) => ({
							streamingResults: {
								...state.streamingResults,
								[messageId]: results,
							},
						}));
					},

					// Complete streaming message
					completeStreamingMessage: async (
						messageId,
						messageType,
					) => {
						const {
							streamingContent,
							streamingResults,
							selectedChat,
							lastUserContent,
							chats,
						} = get();

						if (!selectedChat) return;

						const content = streamingContent[messageId] || '';
						const results = streamingResults[messageId] || [];
						const dashboardLink = `${process.env.NEXT_PUBLIC_DASHBOARD_URL}/chats/${selectedChat.id}`;

						logActivity(getTrackUID(), 'query', {
							user: lastUserContent,
							assistant: content,
							dashboard_link: dashboardLink,
						});
						let uniqueDocsContent = { relatedDocContent: '' };
						if (
							['retrieval_date_decay', 'retrieval'].includes(
								messageType,
							)
						) {
							uniqueDocsContent = await searchResult({
								messageId,
								keywordWeight: '0.4',
							});
						}

						// Update the streamed message in the selected chat
						const updatedMessages = selectedChat.messages.map(
							(msg) =>
								msg.isStreaming || msg.id === messageId
									? {
											id: messageId,
											role: 'assistant',
											content:
												content +
												uniqueDocsContent.relatedDocContent,
											references: results,
											timestamp: new Date().toISOString(),
											isStreaming: false,
											isThinking: false,
										}
									: msg,
						);

						// Update title if needed
						let title = selectedChat.title;
						if (title === 'New Conversation' && lastUserContent) {
							title =
								lastUserContent.substring(0, 30) +
								(lastUserContent.length > 30 ? '...' : '');
						}

						// Update lastMessage
						const lastMessage =
							content.substring(0, 50) +
							(content.length > 50 ? '...' : '');

						// Current timestamp for ordering
						const currentTimestamp = new Date().toISOString();

						// Update selected chat
						const updatedSelectedChat = {
							...selectedChat,
							messages: updatedMessages,
							title,
							lastMessage,
							timestamp: currentTimestamp,
						};

						// Also update in chats list
						let updatedChats = chats.map((chat) =>
							chat.id === selectedChat.id
								? updatedSelectedChat
								: chat,
						);

						// Sort chats by timestamp, newest first
						updatedChats = updatedChats.sort(
							(a, b) =>
								new Date(b.timestamp).getTime() -
								new Date(a.timestamp).getTime(),
						);

						localStorage.setItem(
							'lastSelectedChat',
							JSON.stringify(updatedSelectedChat),
						);

						set({
							selectedChat: updatedSelectedChat,
							chats: updatedChats,
							// Clear streaming content/results for this message
							streamingContent: {
								...streamingContent,
								[messageId]: undefined,
								// eslint-disable-next-line @typescript-eslint/no-explicit-any
							} as any,
							streamingResults: {
								...streamingResults,
								[messageId]: undefined,
								// eslint-disable-next-line @typescript-eslint/no-explicit-any
							} as any,
						});
					},

					openChat: (chat) => {
						const { chats } = get();
						// Check if the chat already exists in the list.
						const exists = chats.find((c) => c.id === chat.id);
						if (exists) {
							set({ selectedChat: chat, view: 'chat' });
							localStorage.setItem(
								'lastSelectedChat',
								JSON.stringify(chat),
							);
						}
					},

					createSessionFromSharedChat: async (user, sharedChatId) => {
						const createdSession = await sessionFromSharedChat(
							user,
							sharedChatId,
						);
						const processedMessages: Message[] = [];
						for (const msg of createdSession.messages) {
							processedMessages.push({
								id: msg.id,
								role: 'user',
								content: msg.query,
								timestamp: msg.createdAt,
							});

							if (msg.status === 'completed' && msg.response) {
								try {
									const responseObj = JSON.parse(
										msg.response,
									);
									processedMessages.push({
										id: msg.id + '-assistant',
										role: 'assistant',
										content:
											responseObj.answer ||
											"Sorry, I couldn't process that request.",
										timestamp: msg.createdAt,
										references: responseObj.results || [],
									});
								} catch {
									processedMessages.push({
										id: msg.id + '-assistant',
										role: 'assistant',
										content:
											'Sorry, there was an error processing the response.',
										timestamp: msg.createdAt,
										isError: true,
									});
								}
							}
						}
						const newChat: Chat = {
							id: createdSession.id,
							title:
								processedMessages.length > 1
									? processedMessages[
											processedMessages.length - 2
										].content
									: 'New Conversation',
							lastMessage:
								processedMessages.length > 1
									? processedMessages[
											processedMessages.length - 1
										].content
									: '',
							timestamp: createdSession.createdAt,
							messages: processedMessages,
						};
						localStorage.setItem(
							'lastSelectedChat',
							JSON.stringify(newChat),
						);
						set((state) => ({
							chats: [newChat, ...state.chats],
							selectedChat: newChat,
							view: 'chat',
						}));
					},
				}),
				{
					name: `chat-storage-${user.id}`, // Include userId in storage key for user-specific persistence
					partialize: (state) => ({
						chats: state.chats,
					}),
				},
			),
		),
	);
};

// Mapping to store individual user stores
const storeCache: Record<string, ReturnType<typeof createChatStore>> = {};

// Hook to use the chat store with a user
export const useChatStore = (user?: User) => {
	// If user is provided, ensure their store exists and set as active
	if (user) {
		if (!storeCache[user.id]) {
			storeCache[user.id] = createChatStore(user);
		}
		activeStoreId = user.id; // Set as active store
		return storeCache[user.id]();
	}

	// If no user provided but we have an active store, use that
	if (!user && activeStoreId && storeCache[activeStoreId]) {
		return storeCache[activeStoreId]();
	}

	// If no user and no active store, return minimal empty store
	return create<ChatState>()(() => ({
		view: 'list',
		isLoading: true,
		userId: '',
		email: '',
		name: '',
		chats: [],
		selectedChat: null,
		thinkingMessageId: null,
		thinkingStage: 0,
		lastUserContent: '',
		streamingContent: {},
		streamingResults: {},
		thinkingStages: THINKING_STAGES,
		intervalId: null,
		clearThinkingInterval: () => {},
		setView: () => {},
		loadChats: async () => {},
		selectChat: () => {},
		deleteSession: () => {},
		updateUserInfo: () => {},
		clearSelectedChat: () => {},
		createNewChat: async () => {},
		sendChatMessage: async () => {},
		updateThinkingStage: () => {},
		updateStreamingContent: () => {},
		addStreamingResults: () => {},
		completeStreamingMessage: () => {},
		openChat: () => {},
		visitInitialState: () => {},
		sendIntialMessage: async () => {},
		createSessionFromSharedChat: async () => {},
	}))();
};
