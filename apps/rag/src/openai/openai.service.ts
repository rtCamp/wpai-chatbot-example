import { GoogleGenAI } from '@google/genai';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, catchError } from 'rxjs';
import OpenAI from 'openai';

enum PromptType {
	system = 'system',
	inference = 'inference',
	queryProcessor = 'queryProcessor',
}

@Injectable()
export class OpenaiService {
	private readonly openai: OpenAI;
	private readonly gemini: GoogleGenAI;

	constructor(
		private readonly configService: ConfigService,
		private readonly httpService: HttpService,
	) {
		this.openai = new OpenAI({
			apiKey: this.configService.get<string>('OPEN_AI_API_KEY'),
		});
		this.gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
	}

	async getEmbeddings(text: string): Promise<number[]> {
		try {
			const response = await this.openai.embeddings.create({
				model: 'text-embedding-3-small',
				input: text,
				encoding_format: 'float',
			});

			return response.data[0].embedding;
		} catch (error) {
			console.error('Error getting embeddings:', error.message);
			throw error;
		}
	}

	async infer(
		text: string,
		inferHistory: Array<any> = [],
		sessionId: string,
	): Promise<{ type: string; reply?: string }> {
		try {
			const greetingOnlyPattern =
				/^(hi|hello|hey|howdy|greetings|hola|bonjour|ciao|namaste|sup|yo|good (morning|afternoon|evening|day)|what'?s up|how (are you|is it going)|nice to (meet|see) you)[\s.,!?;:]*$/i;

			if (greetingOnlyPattern.test(text)) {
				return {
					type: 'greeting',
					reply: 'Hello! How can I assist you today?',
				};
			}

			// const response = await this.openai.chat.completions.create({
			const responseText = await this.queryGemini(
				[
					{
						role: 'system',
						content: await this.getPrompt(
							sessionId,
							PromptType.inference,
						),
					},
					{
						role: 'user',
						content: 'Hi! How are you?',
					},
					{
						role: 'assistant',
						content:
							'{"type": "greeting", "reply": "Hello! How can I assist you today?"}',
					},
					{
						role: 'user',
						content: 'What services do you offer?',
					},
					{
						role: 'assistant',
						content: '{"type": "retrieval"}',
					},
					{
						role: 'user',
						content: 'What is the cost of <service/product>?',
					},
					{
						role: 'assistant',
						content: '{"type": "retrieval"}',
					},
					{
						role: 'user',
						content:
							'Who is <personnel/position>? How many members in your team?',
					},
					{
						role: 'assistant',
						content: '{"type": "retrieval_date_decay"}',
					},
					{
						role: 'user',
						content:
							'How many open source contributions have you made?',
					},
					{
						role: 'assistant',
						content: '{"type": "retrieval_date_decay"}',
					},
					{
						role: 'user',
						content: 'What technologies do you work with?',
					},
					{
						role: 'assistant',
						content: '{"type": "retrieval"}',
					},
					{
						role: 'user',
						content:
							'What do you think about the latest political situation?',
					},
					{
						role: 'assistant',
						content:
							'{"type": "blocked", "reply": "I can only provide information about rtCamp and our services."}',
					},
					{
						role: 'user',
						content: 'Are you built using ChatGPT?',
					},
					{
						role: 'assistant',
						content:
							'{"type": "blocked", "reply": "I am WPAI Chatbot, rtCamp\'s search assistant."}',
					},
					{
						role: 'user',
						content: 'send me migration kit',
					},
					{
						role: 'assistant',
						content: '{"type": "action"}',
					},
					{
						role: 'user',
						content: 'John Doe, john@gmail.com',
					},
					{
						role: 'assistant',
						content: '{"type": "action"}',
					},
					{
						role: 'user',
						content: 'yes, do that.',
					},
					{
						role: 'assistant',
						content: '{"type": "action"}',
					},
					{
						role: 'user',
						content: 'Who wrote the article on this page?',
					},
					{
						role: 'assistant',
						content: '{"type": "page_aware_query"}',
					},
					{
						role: 'user',
						content: 'How do I receive the company newsletter?',
					},
					{
						role: 'assistant',
						content: '{"type": "retrieval"}',
					},
					{
						role: 'user',
						content: 'Subscribe me to the company newsletter.',
					},
					{
						role: 'assistant',
						content: '{"type": "action"}',
					},
					{
						role: 'user',
						content: 'Summarize this page.',
					},
					{
						role: 'assistant',
						content: '{"type": "page_aware_query"}',
					},
					...inferHistory,
					{
						role: 'user',
						content: text,
					},
				],
				0.05,
				150,
				{ type: 'json_object' },
			);

			return JSON.parse(responseText);
		} catch (error) {
			console.error('Error inferring message type:', error);
			return {
				type: 'blocked',
				reply: 'I apologize, but I encountered an error processing your request.',
			};
		}
	}

	async rewriteQuery(
		currentQuery: string,
		previousQueries: string[] = [],
		contextWindowSize: number = 10,
	): Promise<string | null> {
		if (!previousQueries.length) return null;

		// Take last N queries based on window size
		const recentQueries = previousQueries.slice(0, contextWindowSize);

		try {
			// const response = await this.openai.chat.completions.create({
			const responseText = await this.queryGemini(
				[
					{
						role: 'system',
						content: `You are a query rewriter for a RAG pipeline. Your task is to:
   1. Analyze if the current query contains pronouns (he/she/it/they) or references to previous queries
   2. If yes, rewrite the query to be self-contained using context from previous queries
   3. If no rewriting needed, return the original query unchanged
   4. If query is ambiguous and can't be rewritten with available context, return the original query
   5. Ensure the query is self-contained and can be used stand-alone. All the references must be replaced with actual reference name.

   Remember: your rewritten queries are to be fed to a RAG pipeline, ensure that your rewritten query is accurate and self-contained.

   Example rewriting:
   Previous: "Who is the CEO of rtCamp?"
   Current: "How long has he been at the company?"
   Rewritten: "How long has the CEO been at rtCamp?"

   Previous: "What is your tech stack?"
   Current: "Do you use React?"
   Rewritten: "Do you use React?" (no rewriting needed)

   Previous: [
   "What are RFPs?"
   "Does rtCamp work with them?"
   ],
   Current: "How much time does it take?",
   Rewritten: "How much time does RFP take?"
   `,
					},
					{
						role: 'user',
						content: `Previous queries (from newest to oldest):
   ${recentQueries.join('\n')}

   Current query: ${currentQuery}

   The output should be: <Rewritten query>

   You must replace all pronouns with their actual references. Return only the rewritten query. If no rewriting is needed, return the original query exactly.`,
					},
				],
				0.1,
				100,
			);

			// const rewritten = response.choices[0].message.content.trim();
			const rewritten = responseText;

			// Only return if actually rewritten
			return rewritten !== currentQuery ? rewritten : null;
		} catch (error) {
			console.error('Error rewriting query:', error);
			return null; // Return null on error, falling back to original query
		}
	}

	async processQuery(
		currentQuery: string,
		previousQueries: string[] = [],
		sessionId: string,
	): Promise<{
		rewrittenQuery: string | null;
		expandedQuery: string;
		keywords: string[];
		hybridSearchParams: {
			semanticQuery: string;
			keywordQuery: string;
			suggestedWeights: {
				semantic: number;
				keyword: number;
			};
		};
	}> {
		try {
			// const response = await this.openai.chat.completions.create({
			//   model: 'gpt-3.5-turbo',
			const responseText = await this.queryGemini(
				[
					{
						role: 'system',
						content: await this.getPrompt(
							sessionId,
							PromptType.queryProcessor,
						),
					},
					{
						role: 'user',
						content: `Previous conversation context:
  ${previousQueries.join('\n')}

  Current query: ${currentQuery}`,
					},
				],
				0.1,
				5000,
				{ type: 'json_object' },
			);

			// return JSON.parse(response.choices[0].message.content);
			return JSON.parse(responseText);
		} catch (error) {
			console.error('Error processing query:', error);
			// Fallback to original query with default parameters
			return {
				rewrittenQuery: null,
				expandedQuery: currentQuery,
				keywords: currentQuery.toLowerCase().split(' '),
				hybridSearchParams: {
					semanticQuery: currentQuery,
					keywordQuery: currentQuery,
					suggestedWeights: {
						semantic: 0.5,
						keyword: 0.5,
					},
				},
			};
		}
	}

	async queryGemini(
		messages: Array<{ role: string; content: string }>,
		temperature = 0,
		max_tokens = 100,
		response_format = { type: 'json_object' },
	): Promise<string> {
		const history = messages.map((message) => ({
			role: message.role === 'user' ? 'user' : 'model',
			parts: [
				{
					text: message.content,
				},
			],
		}));

		const response = await this.gemini.models.generateContent({
			model: 'gemini-2.0-flash',
			contents: history,
			config: {
				temperature,
				maxOutputTokens: max_tokens,
				responseMimeType:
					response_format.type === 'json_object'
						? 'application/json'
						: 'text/plain',
			},
		});

		return response.text;
	}

	private async getPrompt(
		sessionId: string,
		type: PromptType = PromptType.system,
	): Promise<string> {
		const apiBaseUrl = this.configService.get<string>('API_BASE_URL');
		const apiKey = this.configService.get<string>('API_KEY');

		if (!apiBaseUrl) {
			throw new Error('API_BASE_URL is not configured');
		}

		if (!apiKey) {
			throw new Error('API_KEY is not configured');
		}

		const headers = {
			'x-api-key': apiKey,
		};

		try {
			// 1. Get session details
			const sessionResponse = await firstValueFrom(
				this.httpService
					.get(`${apiBaseUrl}/sessions/${sessionId}`, { headers })
					.pipe(
						catchError((error) => {
							console.error(
								'Error fetching session:',
								error.message,
							);
							throw error;
						}),
					),
			);

			const session = sessionResponse.data;
			if (!session?.clientId) {
				throw new Error('Session not found or missing clientId');
			}

			// 2. Get system prompts for client
			const systemPromptsResponse = await firstValueFrom(
				this.httpService
					.get(
						`${apiBaseUrl}/system-prompts/client/${session.clientId}`,
						{
							headers,
						},
					)
					.pipe(
						catchError((error) => {
							console.error(
								'Error fetching system prompts:',
								error.message,
							);
							throw error;
						}),
					),
			);

			// Find the prompt for the specified type
			const systemPrompt = systemPromptsResponse.data?.find(
				(prompt: any) => prompt.type === type,
			);

			if (systemPrompt?.prompt?.trim()) {
				return systemPrompt.prompt;
			}

			// 3. If no matching prompt found, get default prompts
			const defaultPromptsResponse = await firstValueFrom(
				this.httpService
					.get(`${apiBaseUrl}/default-prompts`, { headers })
					.pipe(
						catchError((error) => {
							console.error(
								'Error fetching default prompts:',
								error.message,
							);
							throw error;
						}),
					),
			);

			// Return the appropriate default prompt based on type
			const defaultPrompts = defaultPromptsResponse.data;
			switch (type) {
				case PromptType.system:
					return defaultPrompts.system;
				case PromptType.inference:
					return defaultPrompts.inference;
				case PromptType.queryProcessor:
					return defaultPrompts.queryProcessor;
				default:
					return defaultPrompts.systemPrompt; // Default to system prompt
			}
		} catch (error) {
			console.error(`Error retrieving prompt: ${error.message}`);
			throw new Error('Failed to retrieve prompt for session');
		}
	}
}
