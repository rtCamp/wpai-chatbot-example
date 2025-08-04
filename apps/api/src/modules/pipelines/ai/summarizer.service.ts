import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { replacePlaceholders } from '@wpai-chatbot/utils/prompt-placeholders';
import { firstValueFrom, Observable, Subject } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { SummarizeDto } from '@wpai-chatbot/dto/pipelines/summarize.dto';
import { RetrievalResponse } from '@wpai-chatbot/interfaces/retriever.interface';
import { PrismaService } from '@wpai-chatbot/prisma.service';
import { Response } from 'express';
import { Content, GoogleGenAI, PartListUnion } from '@google/genai';
import { PromptType } from '@prisma/client';
import { isEmpty } from 'class-validator';
import { logActivity } from '@wpai-chatbot/utils/salespanel';

import defaultPrompts from '../../../default-prompts';

import {
	sendEmail,
	submitContactForm,
	execute,
	getMeetingSlots,
	bookMeetingSlot,
} from './Tools/gemini-tools';

const SYSTEM_INSTRUCTION = defaultPrompts.systemPrompt;

export interface StreamingResponse {
	chunk: string;
	done: boolean;
	fullResponse?: string;
}

@Injectable()
export class SummarizerService {
	private readonly headers: Record<string, string>;
	private readonly baseUrl: string;
	private readonly assistantId: string;

	constructor(
		private prismaService: PrismaService,
		private readonly configService: ConfigService,
		private readonly httpService: HttpService,
	) {
		this.baseUrl = this.configService.get<string>('OPEN_AI_API_ENDPOINT');
		this.assistantId = this.configService.get<string>(
			'OPEN_AI_ASSISTANT_ID',
		);
		this.headers = {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${this.configService.get<string>('OPEN_AI_API_KEY')}`,
			'OpenAI-Beta': 'assistants=v2',
			'Accept-Encoding': 'gzip, deflate',
		};
	}

	async summarize(
		data: SummarizeDto,
		session_id: string,
		res?: Response,
	): Promise<string | Observable<StreamingResponse>> {
		if (res) {
			// Handle web response streaming case
			const responseStream = new Subject<StreamingResponse>();
			this.handleStreamForSession(data, session_id, res, responseStream);
			// Return an empty string since the real response is being streamed to res
			return '';
		} else if (res === undefined) {
			return this.streamForSession(data, session_id);
		}
		// return this.queryOpenAi(data, session_id);
		return this.queryGemini(data, session_id);
	}

	async prepare(
		data: RetrievalResponse,
		decay: boolean = false,
	): Promise<SummarizeDto> {
		const { related_documents, question } = data;

		const cleanedDocs = related_documents.map((doc) => {
			const { similarity, source_url, date, text, excerpt } = doc;
			return { similarity, source_url, date, text, excerpt };
		});

		return {
			question: question,
			decay: decay,
			related_documents: cleanedDocs,
		};
	}

	private streamForSession(
		data: SummarizeDto,
		sessionId: string,
	): Observable<StreamingResponse> {
		const subject = new Subject<StreamingResponse>();

		(async () => {
			try {
				const previousMessages =
					await this.prismaService.message.findMany({
						select: { query: true, response: true },
						where: {
							sessionId,
						},
						orderBy: { createdAt: 'asc' },
						// take: 10,
					});

				const history: Content[] = [];

				history.push({
					role: 'user',
					parts: [
						{
							text: `Today's date is ${new Date().toLocaleString('en-US', { timeZone: await this.getUserTimezone(sessionId) })}`,
							// text: `Today's date is ${new Date().toUTCString()}`,
						},
					],
				});
				history.push({
					role: 'model',
					parts: [
						{
							text: `Alright, I'll remember that.`,
						},
					],
				});

				previousMessages.forEach((message) => {
					if (message.query && message.response) {
						let answer = '';
						try {
							answer = JSON.parse(message.response)?.answer;
						} catch (e) {
							console.error('Error parsing response:', e);
							return;
						}

						history.push({
							role: 'user',
							parts: [{ text: message.query }],
						});
						history.push({
							role: 'model',
							parts: [{ text: answer }],
						});
					}
				});

				let userInput = '';

				if (data.originalQuery) {
					if (data.pageContent) {
						userInput = JSON.stringify({
							query: data.originalQuery,
							pageContent: data.pageContent,
						});
					} else {
						userInput = data.originalQuery;
					}
				} else {
					userInput = JSON.stringify(data);
				}

				// Stream response
				await this.streamRunResponseToObservable(
					userInput,
					history,
					subject,
					sessionId,
				);
			} catch (error) {
				const errorMessage = `I apologize, but I'm having trouble processing your request. ${error.message}`;
				subject.next({ chunk: errorMessage, done: true });
				subject.error(error);
			}
		})();

		return subject.asObservable();
	}

	private async handleStreamForSession(
		data: SummarizeDto,
		sessionId: string,
		res: Response,
		subject: Subject<StreamingResponse>,
	): Promise<void> {
		try {
			const session = await this.prismaService.session.findUnique({
				where: { id: sessionId },
			});

			let threadId = session?.openAiThreadId;
			if (!threadId) {
				const thread = await this.createThread();
				threadId = thread.id;
				await this.prismaService.session.update({
					where: { id: sessionId },
					data: { openAiThreadId: threadId },
				});
			}

			const userInput = JSON.stringify(data);
			await this.addMessage(threadId, userInput);

			await this.streamRunResponse(threadId, res, subject);
		} catch (error) {
			const errorMessage = `I apologize, but I'm having trouble processing your request. ${error.message}`;
			res.write(
				`data: ${JSON.stringify({ content: errorMessage, done: true })}\n\n`,
			);
			res.end();
			subject.error(error);
		}
	}

	private async queryGemini(
		data: SummarizeDto,
		sessionId: string,
	): Promise<string> {
		try {
			const previousMessages = await this.prismaService.message.findMany({
				select: { query: true, response: true },
				where: {
					sessionId,
				},
				orderBy: { createdAt: 'asc' },
				take: 10,
			});

			const history: Content[] = [];

			previousMessages.forEach((message) => {
				if (message.query && message.response) {
					let answer = '';
					try {
						answer = JSON.parse(message.response)?.answer;
					} catch (e) {
						console.error('Error parsing response:', e);
						return;
					}

					history.push({
						role: 'user',
						parts: [{ text: message.query }],
					});
					history.push({
						role: 'model',
						parts: [{ text: answer }],
					});
				}
			});

			const userInput = JSON.stringify(data);
			return await this.getGeminiResponse(userInput, history);
		} catch (error) {
			return `I apologize, but I'm having trouble processing your request. ${error.message}`;
		}
	}

	/**
	 * @deprecated Replace with queryGemini
	 * @param data
	 * @param sessionId
	 * @returns
	 */
	private async queryOpenAi(
		data: SummarizeDto,
		sessionId: string,
	): Promise<string> {
		try {
			const session = await this.prismaService.session.findUnique({
				where: { id: sessionId },
			});

			let threadId = session?.openAiThreadId;
			if (!threadId) {
				const thread = await this.createThread();
				threadId = thread.id;
				await this.prismaService.session.update({
					where: { id: sessionId },
					data: { openAiThreadId: threadId },
				});
			}

			const userInput = JSON.stringify(data);
			await this.addMessage(threadId, userInput);
			const run = await this.createRun(threadId);
			await this.pollRunStatus(threadId, run.id);
			return await this.getAssistantResponse(threadId);
		} catch (error) {
			return `I apologize, but I'm having trouble processing your request. ${error.message}`;
		}
	}

	/**
	 * @deprecated Replaced with Gemini streaming
	 * @param threadId
	 * @param subject
	 */
	private async openai_streamRunResponseToObservable(
		threadId: string,
		subject: Subject<StreamingResponse>,
	): Promise<void> {
		try {
			const url = `${this.baseUrl}/threads/${threadId}/runs`;

			const response = await firstValueFrom(
				this.httpService.post(
					url,
					{
						assistant_id: this.assistantId,
						stream: true,
					},
					{
						headers: this.headers,
						responseType: 'stream',
					},
				),
			);

			let fullResponse = '';
			let buffer = '';

			response.data.on('data', (chunk: Buffer) => {
				buffer += chunk.toString();

				// Process events in the buffer - split by double newlines which separate events
				const events = buffer.split('\n\n');
				buffer = events.pop() || ''; // Keep the last potentially incomplete event in the buffer

				for (const eventText of events) {
					const eventLines = eventText.split('\n');
					let currentEvent = '';
					let currentData = '';

					for (const line of eventLines) {
						if (line.startsWith('event:')) {
							currentEvent = line.substring(6).trim();
						} else if (line.startsWith('data:')) {
							currentData = line.substring(5).trim();
						}
					}

					if (!currentEvent || !currentData) continue;

					// Handle the [DONE] event
					if (currentData === '[DONE]') {
						subject.next({ chunk: '', done: true, fullResponse });
						subject.complete();
						return;
					}

					try {
						const parsedData = JSON.parse(currentData);

						// Handle different event types
						if (
							currentEvent === 'thread.message.delta' &&
							parsedData.delta?.content?.[0]?.text?.value
						) {
							const content =
								parsedData.delta.content[0].text.value;
							fullResponse += content;

							subject.next({ chunk: content, done: false });
						} else if (
							currentEvent === 'thread.message.completed' &&
							parsedData.content?.[0]?.text?.value
						) {
							const completeContent =
								parsedData.content[0].text.value;
							fullResponse = completeContent; // Use complete message

							subject.next({
								chunk: '',
								done: true,
								fullResponse,
							});
						} else if (currentEvent === 'thread.run.completed') {
							subject.next({
								chunk: '',
								done: true,
								fullResponse,
							});
							subject.complete();
						}
					} catch (error) {
						// Just log the error and continue with the next event
						console.error(`Error parsing data: ${error}`);
					}
				}
			});

			response.data.on('end', () => {
				subject.next({ chunk: '', done: true, fullResponse });
				subject.complete();
			});

			response.data.on('error', (error: Error) => {
				console.error(`Streaming error: ${error.message}`);
				subject.next({ chunk: error.message, done: true });
				subject.error(error);
			});
		} catch (error) {
			const errorMessage = `Stream initialization error: ${error.message}`;
			console.error(errorMessage);
			subject.next({ chunk: errorMessage, done: true });
			subject.error(error);
		}
	}

	private async streamRunResponseToObservable(
		userQuery: string,
		history: Content[],
		subject: Subject<StreamingResponse>,
		sessionId: string,
	): Promise<void> {
		try {
			const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
			const systemInstruction = await this.getSystemPrompt(sessionId);
			const session = await this.prismaService.session.findUnique({
				where: { id: sessionId },
				select: { user: true },
			});

			const user = session?.user;

			const chat = ai.chats.create({
				model: GEMINI_MODEL,
				history: [...FORMAT_HISTORY, ...history],
				config: {
					systemInstruction: systemInstruction,
					temperature: 0.1,
					tools: [
						{
							functionDeclarations: [
								sendEmail,
								submitContactForm,
								getMeetingSlots,
								bookMeetingSlot,
							],
						},
					],
				},
			});

			let fullResponse = '';
			let message: PartListUnion = userQuery;

			while (isEmpty(fullResponse)) {
				const responseStream = await chat.sendMessageStream({
					message: message,
				});

				for await (const chunk of responseStream) {
					if (chunk.functionCalls && chunk.functionCalls.length > 0) {
						const functionResponses: PartListUnion = [];

						for (const functionCall of chunk.functionCalls) {
							const extraArgs: any = {};

							if (functionCall.name === submitContactForm.name) {
								extraArgs.dashboardUrl = `${process.env.DASHBOARD_URL}/chats/${sessionId}`;
								extraArgs.conversationHistory = chat
									.getHistory()
									.slice(6)
									.reduce((history, content) => {
										if (content.role === 'user') {
											history += `User: ${content.parts.map((part) => part.text).join(' ')}\n`;
										} else if (content.role === 'model') {
											history += `Assistant: ${content.parts.map((part) => part.text).join(' ')}\n`;
										}
										return history;
									}, '');
							} else if (
								functionCall.name === getMeetingSlots.name
							) {
								extraArgs.user_timezone =
									await this.getUserTimezone(sessionId); // India
							} else if (
								functionCall.name === bookMeetingSlot.name
							) {
								// todo: Fetch the timezone from user schema.
								extraArgs.user_timezone =
									await this.getUserTimezone(sessionId); // India
							}

							const executionResult = await execute(
								functionCall.name,
								functionCall.args,
								extraArgs,
							);

							let response: any;
							if (executionResult) {
								response = {
									output: executionResult,
								};
							} else {
								response = {
									error: true,
								};
							}

							// Log activity
							logActivity(
								user?.track_uid,
								`WPAI_CHATBOT Function Call: ${functionCall.name}`,
								{
									response: response,
								},
							);

							functionResponses.push({
								functionResponse: {
									name: functionCall.name,
									response: response,
								},
							});
						}
						message = functionResponses;
					} else {
						fullResponse += chunk.text;
						subject.next({ chunk: chunk.text, done: false });
					}
				}
			}

			subject.next({ chunk: '', done: true, fullResponse });
			subject.complete();
		} catch (error) {
			const errorMessage = `Stream initialization error: ${error.message}`;
			console.error(errorMessage);
			subject.next({ chunk: errorMessage, done: true });
			subject.error(error);
		}
	}

	private async getSystemPrompt(
		sessionId: string,
		type: PromptType = PromptType.system,
	): Promise<string> {
		try {
			// Find the session and get clientId
			const session = await this.prismaService.session.findFirst({
				where: { id: sessionId },
				select: { clientId: true },
			});

			if (!session?.clientId) {
				throw new Error('Session not found or missing clientId');
			}

			// Find the system prompt for this client and type
			const systemPrompt =
				await this.prismaService.systemPrompt.findFirst({
					where: {
						clientId: session.clientId,
						type,
					},
				});

			let unprocessedPrompt = systemPrompt?.prompt || '';

			if (!unprocessedPrompt.trim()) {
				unprocessedPrompt = SYSTEM_INSTRUCTION; // Fallback to default system instruction
			}

			// Process placeholders in the system prompt
			const processedPrompt = await replacePlaceholders(
				unprocessedPrompt,
				session.clientId,
				type,
			);

			return processedPrompt;
		} catch (error) {
			console.error(`Error retrieving system prompt: ${error.message}`);
			return SYSTEM_INSTRUCTION; // Fallback to default system instruction on error
		}
	}

	// Add this method to handle polling for a response if streaming ends early
	private async pollRunStatusAndSendResponse(
		threadId: string,
		runId: string,
		subject: Subject<StreamingResponse>,
		currentResponse: string,
	): Promise<void> {
		try {
			await this.pollRunStatus(threadId, runId);

			// Get the completed response
			const response = await this.getAssistantResponse(threadId);

			// Send the final response
			subject.next({
				chunk: response,
				done: true,
				fullResponse: response,
			});
			subject.complete();
		} catch (error) {
			const errorMessage = `Failed to poll for response: ${error.message}`;
			console.error(errorMessage);

			// If we have a partial response, send that
			if (currentResponse) {
				subject.next({
					chunk: '',
					done: true,
					fullResponse: currentResponse,
				});
			} else {
				subject.next({
					chunk: errorMessage,
					done: true,
				});
			}
			subject.complete();
		}
	}

	private async streamRunResponse(
		threadId: string,
		res: Response,
		subject: Subject<StreamingResponse>,
	): Promise<void> {
		try {
			const url = `${this.baseUrl}/threads/${threadId}/runs`;

			const response = await firstValueFrom(
				this.httpService.post(
					url,
					{
						assistant_id: this.assistantId,
						stream: true,
					},
					{
						headers: this.headers,
						responseType: 'stream',
					},
				),
			);

			res.setHeader('Content-Type', 'text/event-stream');
			res.setHeader('Cache-Control', 'no-cache, no-store');
			res.setHeader('Connection', 'keep-alive');
			res.setHeader('X-Accel-Buffering', 'no');

			res.write(
				`data: ${JSON.stringify({ content: '', initializing: true, done: false })}\n\n`,
			);
			res.flushHeaders();

			let fullResponse = '';

			response.data.on('data', (chunk: Buffer) => {
				const lines = chunk.toString().split('\n\n');

				for (const line of lines) {
					if (!line.trim() || !line.startsWith('data: ')) continue;

					const eventData = line.substring(6);

					if (eventData === '[DONE]') {
						res.write(
							`data: ${JSON.stringify({ content: '', fullResponse, done: true })}\n\n`,
						);
						res.end();
						subject.next({ chunk: fullResponse, done: true });
						subject.complete();
						return;
					}

					try {
						const parsedData = JSON.parse(eventData);

						if (
							parsedData.event === 'thread.message.delta' &&
							parsedData.data?.delta?.content?.[0]?.text?.value
						) {
							const content =
								parsedData.data.delta.content[0].text.value;
							fullResponse += content;

							res.write(
								`data: ${JSON.stringify({ content, done: false })}\n\n`,
							);
							res.flushHeaders();

							subject.next({ chunk: content, done: false });
						}

						if (parsedData.event === 'thread.run.completed') {
							res.write(
								`data: ${JSON.stringify({ content: '', fullResponse, done: true })}\n\n`,
							);
							res.end();
							subject.next({ chunk: fullResponse, done: true });
							subject.complete();
							return;
						}
					} catch (e) {
						console.error('Error parsing stream data:', e);
					}
				}
			});

			response.data.on('end', () => {
				res.write(
					`data: ${JSON.stringify({ content: '', fullResponse, done: true })}\n\n`,
				);
				res.end();
				subject.next({ chunk: fullResponse, done: true });
				subject.complete();
			});

			response.data.on('error', (error: Error) => {
				const errorMessage = `Streaming error: ${error.message}`;
				console.error(errorMessage);

				res.write(
					`data: ${JSON.stringify({ content: errorMessage, done: true })}\n\n`,
				);
				res.end();
				subject.error(error);
			});
		} catch (error) {
			const errorMessage = `Stream initialization error: ${error.message}`;
			console.error(errorMessage);

			res.write(
				`data: ${JSON.stringify({ content: errorMessage, done: true })}\n\n`,
			);
			res.end();
			subject.error(error);
		}
	}

	private async makeRequest<T>(
		method: string,
		url: string,
		data?: any,
	): Promise<T> {
		return firstValueFrom(
			this.httpService
				.request<T>({
					method,
					url: `${this.baseUrl}${url}`,
					data,
					headers: this.headers,
					timeout: 30000,
				})
				.pipe(
					timeout(30000),
					catchError((error) => {
						const message =
							error.response?.data?.error?.message ||
							error.message;
						throw new Error(
							`OpenAI API request failed: ${message}`,
						);
					}),
				),
		).then((response) => response.data);
	}

	private async createThread(): Promise<{ id: string }> {
		return this.makeRequest<{ id: string }>('POST', '/threads');
	}

	private async addMessage(threadId: string, content: string): Promise<any> {
		return this.makeRequest('POST', `/threads/${threadId}/messages`, {
			role: 'user',
			content,
		});
	}

	private async createRun(threadId: string): Promise<{ id: string }> {
		return this.makeRequest<{ id: string }>(
			'POST',
			`/threads/${threadId}/runs`,
			{
				assistant_id: this.assistantId,
			},
		);
	}

	private async pollRunStatus(
		threadId: string,
		runId: string,
		maxAttempts = 15,
		interval = 2000,
	): Promise<void> {
		const terminalStates = ['completed', 'failed', 'cancelled', 'expired'];

		for (let i = 0; i < maxAttempts; i++) {
			const response = await this.makeRequest<{ status: string }>(
				'GET',
				`/threads/${threadId}/runs/${runId}`,
			);
			const { status } = response;

			if (status === 'completed') return;
			if (terminalStates.includes(status)) {
				throw new Error(`Run failed with status: ${status}`);
			}

			await new Promise((resolve) => setTimeout(resolve, interval));
		}
		throw new Error('Polling timed out');
	}

	private async getGeminiResponse(
		query: string,
		history: Content[],
	): Promise<string> {
		try {
			const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

			const chat = ai.chats.create({
				model: GEMINI_MODEL,
				history: [...FORMAT_HISTORY, ...history],
				config: {
					systemInstruction: SYSTEM_INSTRUCTION,
				},
			});

			const response = await chat.sendMessage({ message: query });

			return response.text;
		} catch (error) {
			return `Failed to get Gemini response: ${error.message}`;
		}
	}

	private async getAssistantResponse(threadId: string): Promise<string> {
		try {
			interface MessagesResponse {
				data: Array<{
					content: Array<{
						text: { value: string };
					}>;
				}>;
			}

			const messages = await this.makeRequest<MessagesResponse>(
				'GET',
				`/threads/${threadId}/messages?limit=1&order=desc`,
			);

			const response = messages?.data?.[0]?.content?.[0]?.text?.value;
			if (!response) {
				throw new Error('No response received');
			}

			return response.trim();
		} catch (error) {
			throw new Error(`Failed to get response: ${error.message}`);
		}
	}

	parseSummary(summary: string): { answer: string } {
		try {
			const cleanedSummary = summary
				.replace(/\n/g, ' ')
				.replace(/\s+/g, ' ')
				.replace(/\\/g, '')
				.replace(/"/g, "'")
				.trim();

			const parsed = JSON.parse(cleanedSummary) as { answer: string };

			if (!parsed.answer || typeof parsed.answer !== 'string') {
				throw new Error(
					'Invalid summary format: missing or invalid answer field',
				);
			}

			parsed.answer = parsed.answer
				.replace(/\n/g, ' ')
				.replace(/\s+/g, ' ')
				.replace(/\\/g, '')
				.trim();

			return parsed;
		} catch (error) {
			if (error instanceof Error) {
				throw new Error(`Failed to parse summary: ${error.message}`);
			}
			throw new Error('Failed to parse summary');
		}
	}

	private async getUserTimezone(sessionId: string): Promise<string> {
		const session = await this.prismaService.session.findUnique({
			where: { id: sessionId },
			select: { userTimeZone: true },
		});

		// Return the user's timezone if available, otherwise fallback to default
		return session?.userTimeZone || 'utc';
	}
}

// const GEMINI_MODEL = 'gemini-2.5-pro-exp-03-25'; // free model - 5 req/min and 25 req/day
const GEMINI_MODEL = 'gemini-2.0-flash'; // free model - 15 req/min and 1500 req/day
// const GEMINI_MODEL = 'gemini-2.5-pro-preview-03-25', // can't use as a free model.

const FORMAT_HISTORY = [
	{
		role: 'user',
		parts: [{ text: 'What services do you offer?' }],
	},
	{
		role: 'model',
		parts: [
			{
				text: `We specialize in **enterprise WordPress solutions** for publishers and businesses.`,
			},
		],
	},
	{
		role: 'user',
		parts: [{ text: 'What is your pricing?' }],
	},
	{
		role: 'model',
		parts: [
			{
				text: `We offer competitive pricing tailored to your needs. [Contact us](https://rtcamp.com/contact?utm_source=wpai-chatbot&utm_medium=referral) for a personalized quote.`,
			},
		],
	},
];
