import { PrismaService } from '@wpai-chatbot/prisma.service';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Message } from '@wpai-chatbot/interfaces/message.interface';
import { RelatedDocument } from '@wpai-chatbot/interfaces/retriever.interface';
import { OpenaiService } from '@wpai-chatbot/rag';
import { Logger } from '@nestjs/common';
import { Observable, isObservable, lastValueFrom } from 'rxjs';
import { tap, catchError, bufferTime } from 'rxjs/operators';

import { ScrapeService } from '../firecrawl/scrape/scrape.service';

import { SummarizerService, StreamingResponse } from './ai/summarizer.service';
import { RetrieverService } from './ai/retriever.service';

interface ProcessedQueryResult {
	hybridSearchParams: {
		semanticQuery: string;
		keywordQuery: string;
		suggestedWeights: Record<string, number>;
	};
	type?: string;
}

interface MessageType {
	type: string;
	reply?: string;
}

@Processor('message')
export class MessageConsumer extends WorkerHost {
	private readonly logger = new Logger(MessageConsumer.name);
	private readonly STREAM_UPDATE_INTERVAL = 1000;

	constructor(
		private prisma: PrismaService,
		private readonly retrieverService: RetrieverService,
		private readonly summarizeService: SummarizerService,
		private readonly openaiService: OpenaiService,
		private readonly scrapeService: ScrapeService,
	) {
		super();
	}

	async process(job: Job<Message>): Promise<void> {
		const { data } = job;

		try {
			// Update the session's updatedAt timestamp at the beginning of processing
			await this.prisma.session.update({
				where: { id: data.sessionId },
				data: { updatedAt: new Date() },
			});

			// Todo: Handle existing message condition in later sprints.

			// // Quick check for existing message to avoid processing
			// const existingMessage = await this.prisma.message.findFirst({
			//   where: {
			//     query: data.query,
			//     status: 'completed',
			//     response: { not: '' },
			//   },
			//   select: {
			//     retrieval_result: true,
			//     summary: true,
			//     response: true,
			//   },
			// });

			// // todo: For testing purposes, we can skip the existing message check
			// if (existingMessage && process.env.NODE_ENV !== 'development') {
			//   await this.prisma.message.update({
			//     where: { id: data.id },
			//     data: {
			//       retrieval_result: existingMessage.retrieval_result,
			//       summary: existingMessage.summary,
			//       response: existingMessage.response,
			//       status: 'completed',
			//     },
			//   });
			//   return;
			// }

			// Get previous messages for context (batch query)
			const previousMessages = await this.prisma.message.findMany({
				select: { query: true, response: true },
				where: {
					id: { not: data.id },
					sessionId: data.sessionId,
				},
				orderBy: { createdAt: 'asc' },
				// take: 10,
			});

			const inferHistory = [];

			previousMessages.forEach((message) => {
				if (message.query && message.response) {
					let answer = '';
					try {
						answer = JSON.parse(message.response)?.answer;
					} catch (e) {
						console.error('Error parsing response:', e);
						return;
					}

					inferHistory.push({
						role: 'user',
						content: message.query,
					});
					inferHistory.push({
						role: 'assistant',
						content: answer,
					});
				}
			});

			const messageType = (await this.openaiService.infer(
				data.query,
				inferHistory,
				data.sessionId,
			)) as MessageType;

			if (['blocked', 'greeting'].includes(messageType.type)) {
				const response = {
					answer: messageType.reply,
				};

				await this.prisma.message.update({
					where: { id: data.id },
					data: {
						type: messageType.type,
						response: JSON.stringify(response),
						status: 'completed',
					},
				});
				return;
			}

			const processedQuery = (await this.openaiService.processQuery(
				data.query,
				previousMessages.map(
					(msg) => `User: ${msg.query}\nModel: ${msg.response}`,
				),
				data.sessionId,
			)) as ProcessedQueryResult;

			// Perform retrieval with optimized parameters based on query type
			const retrieveOptions = {
				query:
					processedQuery.hybridSearchParams?.semanticQuery ||
					data.query,
				searchParams: {
					keywordQuery:
						processedQuery.hybridSearchParams?.keywordQuery ||
						data.query,
					weights: (processedQuery.hybridSearchParams
						?.suggestedWeights as any) || {
						semantic: 0.5,
						keyword: 0.5,
					},
					limit: 10,
				},
			};

			// Batch DB update with query processing results and status change
			await this.prisma.message.update({
				where: { id: data.id },
				data: {
					searchParams: JSON.stringify(processedQuery),
					type: messageType.type,
					status: 'processing',
				},
			});

			// Retrieve documents
			const retrievedData =
				await this.retrieverService.retrieveRRF(retrieveOptions);

			// Prepare for summary (only update DB with retrieval results now)
			await this.prisma.message.update({
				where: { id: data.id },
				data: {
					retrieval_result: JSON.stringify(retrievedData),
				},
			});

			const safeSummarizerQuery = await this.summarizeService.prepare(
				retrievedData,
				messageType.type === 'retrieval_date_decay',
			);

			if (messageType.type === 'action') {
				safeSummarizerQuery.originalQuery = data.query;
			}

			let pageTitleHtml = '';
			if (messageType.type === 'page_aware_query') {
				safeSummarizerQuery.originalQuery = data.query;

				try {
					const scrapeResult = await this.scrapeService.scrape(
						data.pageUrl,
						'single page',
					);
					safeSummarizerQuery.pageContent =
						JSON.stringify(scrapeResult);

					const pageUrl = new URL(data.pageUrl);
					pageUrl.searchParams.append('utm_source', 'wpai-chatbot');
					pageUrl.searchParams.append('utm_medium', 'referral');

					if (scrapeResult?.data?.metadata?.title) {
						pageTitleHtml = `<p><strong>${scrapeResult.data.metadata.title}</strong> [<a target="_blank" href="${pageUrl.toString()}">View page</a>]</p>`;
					}
				} catch {
					safeSummarizerQuery.pageContent =
						'Error: Failed to fetch page.';
				}
			}

			// Handle the summarization with optimized streaming
			let summary = '';
			summary += pageTitleHtml;
			try {
				const summaryResult = await this.summarizeService.summarize(
					safeSummarizerQuery,
					data.sessionId,
				);

				if (typeof summaryResult === 'string') {
					// Non-streaming path - single DB update
					summary = summaryResult;
					await this.createFinalResponse(
						data.id,
						summary,
						retrievedData,
					);
				} else if (isObservable(summaryResult)) {
					// Streaming path - optimized with bufferTime
					let lastChunkTime = Date.now();

					await lastValueFrom(
						(summaryResult as Observable<StreamingResponse>).pipe(
							// Buffer chunks to reduce DB updates (collect chunks for X milliseconds)
							bufferTime(this.STREAM_UPDATE_INTERVAL),
							tap((chunks) => {
								if (chunks.length === 0) return;

								// Process the buffered chunks
								for (const {
									chunk,
									done,
									fullResponse,
								} of chunks) {
									if (chunk) {
										summary += chunk;
									}

									if (done && fullResponse) {
										summary = pageTitleHtml + fullResponse;
									}
								}

								// Only update DB if enough time has passed or we're done
								const now = Date.now();
								const lastChunk = chunks[chunks.length - 1];
								if (
									lastChunk.done ||
									now - lastChunkTime >
										this.STREAM_UPDATE_INTERVAL
								) {
									this.updateDatabase(
										data.id,
										summary,
										retrievedData,
										lastChunk.done,
									);
									lastChunkTime = now;
								}
							}),
							catchError((error) => {
								throw error;
							}),
						),
					);
				} else {
					throw new Error(
						`Unexpected result type from summarizer: ${typeof summaryResult}`,
					);
				}
			} catch (error) {
				this.logger.error(
					`Error during summarization for ${data.id}: ${error.message}`,
				);
				throw error;
			}
		} catch (error) {
			this.logger.error(
				`Error processing message ${data.id}: ${error.message}`,
			);

			// Even if there's an error, make sure the session updatedAt is updated
			await this.prisma.session
				.update({
					where: { id: data.sessionId },
					data: { updatedAt: new Date() },
				})
				.catch((sessionError) => {
					// Log but don't throw to avoid masking the original error
					this.logger.error(
						`Failed to update session timestamp for ${data.sessionId}: ${sessionError.message}`,
					);
				});

			await this.prisma.message.update({
				where: { id: data.id },
				data: { status: 'failed' },
			});
			throw error;
		}
	}

	// Create final response with complete data
	private async createFinalResponse(
		messageId: string,
		summary: string,
		retrievedData: any,
	): Promise<void> {
		try {
			const responseObj = this.formatResponseObject(
				summary,
				retrievedData,
			);

			await this.prisma.message.update({
				where: { id: messageId },
				data: {
					summary: summary,
					response: JSON.stringify(responseObj),
					status: 'completed',
				},
			});
		} catch (error) {
			this.logger.error(
				`Final response creation failed for ${messageId}: ${error.message}`,
			);
		}
	}

	// Helper method to update the database with the current summary (reduced frequency)
	private async updateDatabase(
		messageId: string,
		summary: string,
		retrievedData: any,
		isCompleted: boolean,
	): Promise<void> {
		try {
			const responseObj = this.formatResponseObject(
				summary,
				retrievedData,
			);

			await this.prisma.message.update({
				where: { id: messageId },
				data: {
					summary: summary,
					response: JSON.stringify(responseObj),
					status: isCompleted ? 'completed' : 'processing',
				},
			});
		} catch (error) {
			this.logger.error(
				`Database update failed for ${messageId}: ${error.message}`,
			);
		}
	}

	// Extract response formatting to a separate method to avoid duplication
	private formatResponseObject(summary: string, retrievedData: any) {
		return {
			answer: summary,
			results: retrievedData.related_documents
				.filter(
					(doc: RelatedDocument) =>
						doc?.type !== 'internal_doc' &&
						doc?.type !== 'do_not_cite',
				)
				.sort((a, b) => b.similarity - a.similarity)
				.map((doc: RelatedDocument) => ({
					title: doc?.title,
					url: doc?.source_url,
					score: doc?.similarity,
					text: doc?.text,
					excerpt: doc?.excerpt,
				})),
		};
	}
}
