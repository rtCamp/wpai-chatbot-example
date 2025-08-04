import { readFile } from 'fs/promises';

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { weaviateV2 } from 'weaviate-client';
import { WeaviateClient } from 'weaviate-client/dist/node/cjs/v2';
import { OpenaiService } from '@rag/openai/openai.service';
import { LangchainService } from '@rag/langchain/langchain.service';
import { init } from '@paralleldrive/cuid2';

@Injectable()
export class WeaviateService implements OnModuleInit {
	public collection: string = 'RtCampCom';
	private client: WeaviateClient;
	private host: string;
	private port: number;
	private readonly createId: () => string;

	private readonly logger = new Logger('Weaviate');

	constructor(
		private readonly configService: ConfigService,
		private readonly openAiService: OpenaiService,
		private readonly langchainService: LangchainService,
	) {
		const host =
			this.configService.get<string>('WEAVIATE_HOST') ?? 'weaviate';
		const port = this.configService.get<string>('WEAVIATE_PORT') ?? '8080';

		if (!host) {
			throw new Error('WEAVIATE_HOST is missing');
		}

		this.host = host;
		this.port = parseInt(port, 10);

		this.createId = init({ length: 10 });
	}

	async onModuleInit() {
		try {
			this.logger.log(
				`Attempting Weaviate connection: ${this.host}:${this.port}`,
			);
			this.client = await weaviateV2.client({
				scheme: 'http',
				host: `${this.host}:${this.port}`,
			});

			const isUp = await this.client.misc.liveChecker().do();

			if (!isUp) {
				throw Error('Weaviate service is down');
			}

			const classExists = await this.client.schema.exists(
				this.collection,
			);
			if (!classExists) {
				this.logger.log(`Created schema: ${this.collection}`);
				await this.createSchema(this.collection);
			}

			this.logger.log('Connected to Weaviate');
		} catch {
			this.logger.error('Error connecting to Weaviate');
		}
	}

	async createSchema(className: string) {
		const schemaConfig = {
			class: className,
			vectorizer: 'none',
			properties: [
				{
					name: 'title',
					dataType: ['text'],
					indexInverted: true,
				},
				{
					name: 'content',
					dataType: ['text'],
					indexInverted: true,
				},
				{
					name: 'excerpt',
					dataType: ['text'],
					indexInverted: true,
				},
				{
					name: 'date',
					dataType: ['date'],
					indexInverted: true,
				},
				{
					name: 'source_url',
					dataType: ['string'],
					indexInverted: true,
				},
				{
					name: 'type',
					dataType: ['string'],
				},
			],
		};

		await this.client.schema.classCreator().withClass(schemaConfig).do();
	}

	async insertDocument(collection: string, data: any): Promise<any> {
		try {
			const result = await this.client.data
				.creator()
				.withClassName(collection)
				.withProperties(data)
				.do();

			return result;
		} catch (error) {
			console.error(
				'Error inserting document:',
				error.response?.data || error.message,
			);
			throw error;
		}
	}

	async searchFusion(
		queryProcessingResult: {
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
		},
		limit = 10,
	): Promise<any> {
		try {
			const embedding = await this.openAiService.getEmbeddings(
				queryProcessingResult.hybridSearchParams.semanticQuery,
			);

			// Get 3x documents
			const result = await this.client.graphql
				.get()
				.withClassName(this.collection)
				.withHybrid({
					query: queryProcessingResult.hybridSearchParams
						.keywordQuery,
					vector: embedding,
					alpha: queryProcessingResult.hybridSearchParams
						.suggestedWeights.keyword,
				})
				.withFields(
					[
						'title',
						'content',
						'excerpt',
						'date',
						'source_url',
						'type',
						'language',
						'_additional { id certainty }',
					].join(' '),
				)
				.withLimit(limit * 3)
				.do();

			const allResults = result.data.Get[this.collection];
			// Take top N results
			const topResults = allResults.slice(0, limit);

			return {
				results: topResults,
				queryMetadata: {
					originalQuery:
						queryProcessingResult.rewrittenQuery ||
						queryProcessingResult.expandedQuery,
					usedSemanticQuery:
						queryProcessingResult.hybridSearchParams.semanticQuery,
					usedKeywordQuery:
						queryProcessingResult.hybridSearchParams.keywordQuery,
					keywordWeight:
						queryProcessingResult.hybridSearchParams
							.suggestedWeights.keyword,
					semanticWeight:
						queryProcessingResult.hybridSearchParams
							.suggestedWeights.semantic,
					totalCandidates: allResults.length,
				},
			};
		} catch (error) {
			console.error(
				'Error retrieving data:',
				error.response?.data || error.message,
			);
			throw error;
		}
	}

	async searchWithRRF(
		queryProcessingResult: {
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
		},
		limit = 10,
	): Promise<any> {
		try {
			const embedding = await this.openAiService.getEmbeddings(
				queryProcessingResult.hybridSearchParams.semanticQuery,
			);

			// Get 3x documents for both searches
			const vectorResults = await this.client.graphql
				.get()
				.withClassName(this.collection)
				.withNearVector({
					vector: embedding,
				})
				.withFields(
					[
						'title',
						'content',
						'excerpt',
						'date',
						'source_url',
						'type',
						'language',
						'_additional { id certainty }',
					].join(' '),
				)
				.withLimit(limit * 3)
				.do();

			const keywordResults = await this.client.graphql
				.get()
				.withClassName(this.collection)
				.withBm25({
					query: queryProcessingResult.hybridSearchParams
						.keywordQuery,
				})
				.withFields(
					[
						'title',
						'content',
						'excerpt',
						'date',
						'source_url',
						'type',
						'language',
						'_additional { id certainty }',
					].join(' '),
				)
				.withLimit(limit * 3)
				.do();

			const allResults = this.fuseWithRRF(
				vectorResults.data.Get[this.collection],
				keywordResults.data.Get[this.collection],
				queryProcessingResult.hybridSearchParams.suggestedWeights,
			);

			// Take top N results after fusion
			const topResults = allResults.slice(0, limit);

			return {
				results: topResults,
				queryMetadata: {
					originalQuery:
						queryProcessingResult.rewrittenQuery ||
						queryProcessingResult.expandedQuery,
					usedSemanticQuery:
						queryProcessingResult.hybridSearchParams.semanticQuery,
					usedKeywordQuery:
						queryProcessingResult.hybridSearchParams.keywordQuery,
					semanticWeight:
						queryProcessingResult.hybridSearchParams
							.suggestedWeights.semantic,
					keywordWeight:
						queryProcessingResult.hybridSearchParams
							.suggestedWeights.keyword,
					totalCandidates: allResults.length,
				},
			};
		} catch (error) {
			console.error('Error retrieving data:', error);
			throw error;
		}
	}

	private fuseWithRRF(
		vectorResults: any[],
		keywordResults: any[],
		weights: { semantic: number; keyword: number },
		k: number = 60,
	): any[] {
		const scores = new Map<string, number>();

		// Process vector results with semantic weight
		vectorResults.forEach((doc, rank) => {
			const rrf = weights.semantic * (1 / (k + rank + 1));
			scores.set(
				doc._additional.id,
				(scores.get(doc._additional.id) || 0) + rrf,
			);
		});

		// Process keyword results with keyword weight
		keywordResults.forEach((doc, rank) => {
			const rrf = weights.keyword * (1 / (k + rank + 1));
			scores.set(
				doc._additional.id,
				(scores.get(doc._additional.id) || 0) + rrf,
			);
		});

		// Combine and sort results
		const allDocs = new Map<string, any>();
		[...vectorResults, ...keywordResults].forEach((doc) => {
			allDocs.set(doc._additional.id, doc);
		});

		return Array.from(scores.entries())
			.sort((a, b) => b[1] - a[1])
			.map(([id, score]) => ({
				...allDocs.get(id),
				score, // Include the RRF score in the returned document
			}));
	}

	async loadJsonIntoWeaviate(jsonPath: string, collection: string) {
		const data = JSON.parse(await readFile(jsonPath, 'utf8'));

		for (let i = 0; i < data.length; i += 10) {
			const batch = data.slice(i, i + 10);

			let batchSuccess = false;
			let batchAttempts = 0;
			const maxBatchAttempts = 3;

			while (!batchSuccess && batchAttempts < maxBatchAttempts) {
				try {
					// Process each item in the batch with individual error handling
					await Promise.all(
						batch.map(async (item, itemIndex) => {
							try {
								this.logger.log(
									`Processing item ${i + itemIndex}: ${item.title}`,
								);

								const exists = await this.checkDocumentExists(
									collection,
									item.link,
								);

								if (exists) {
									this.logger.log(
										`Document already exists: ${item.title}`,
									);
									return;
								}

								// Create chunks with more overlap
								const documentId = this.createId();
								const chunks =
									await this.langchainService.createChunks(
										item.content,
										1000, // chunk size
										500, // overlap
									);

								for (
									let chunkIndex = 0;
									chunkIndex < chunks.length;
									chunkIndex++
								) {
									let success = false;
									let attempts = 0;
									const maxAttempts = 3;

									while (!success && attempts < maxAttempts) {
										try {
											const textToEmbed = `TITLE: ${item.title}\n EXCERPT: ${item?.excerpt ?? ''}\n CONTENT: ${chunks[chunkIndex]}`;

											const embedding =
												await this.openAiService.getEmbeddings(
													textToEmbed,
												);

											await this.insertDocument(
												collection,
												{
													title: item.title,
													content: chunks[chunkIndex],
													excerpt:
														item?.excerpt ?? '',
													date: new Date(
														item.date,
													).toISOString(),
													source_url: item.link,
													type: item.type,
													vector: embedding,
													language: 'en',
													chunk_index: chunkIndex,
													total_chunks: chunks.length,
													parent_id: documentId,
												},
											);

											success = true;
										} catch (error) {
											attempts++;
											this.logger.error(
												`Error processing chunk ${chunkIndex} of item ${i + itemIndex}:`,
												error,
											);

											if (
												error.response?.status === 429
											) {
												const waitTime =
													15000 * attempts; // Progressive backoff
												this.logger.log(
													`Rate limit hit, waiting ${waitTime / 1000} seconds...`,
												);
												await new Promise((resolve) =>
													setTimeout(
														resolve,
														waitTime,
													),
												);
											} else if (
												attempts === maxAttempts
											) {
												this.logger.error(
													`Failed to process chunk ${chunkIndex} of ${item.title} after ${maxAttempts} attempts`,
												);
												throw error; // Let the individual item fail
											} else {
												await new Promise((resolve) =>
													setTimeout(
														resolve,
														2000 * attempts,
													),
												);
											}
										}
									}
								}
							} catch (itemError) {
								this.logger.error(
									`Failed to process item ${i + itemIndex}: ${item.title}`,
									itemError,
								);
							}
						}),
					);

					batchSuccess = true;
					await new Promise((resolve) => setTimeout(resolve, 1000));
				} catch (batchError) {
					batchAttempts++;
					console.error(
						`Error in batch ${i / 10 + 1} (attempt ${batchAttempts}):`,
						batchError,
					);

					if (batchAttempts < maxBatchAttempts) {
						const waitTime = 5000 * batchAttempts;
						await new Promise((resolve) =>
							setTimeout(resolve, waitTime),
						);
					} else {
						console.error(
							`Moving to next batch after ${maxBatchAttempts} failed attempts`,
						);
					}
				}
			}
		}
	}

	private async checkDocumentExists(
		collection: string,
		sourceUrl: string,
	): Promise<boolean> {
		try {
			const result = await this.client.graphql
				.get()
				.withClassName(collection)
				.withWhere({
					path: ['source_url'],
					operator: 'Equal',
					valueString: sourceUrl,
				})
				.withFields('source_url') // Added required field
				.withLimit(1)
				.do();

			return result.data.Get[collection].length > 0;
		} catch (error) {
			console.error('Error checking document existence:', error);
			throw error;
		}
	}

	async embedAndInsertDocument({
		title,
		content,
		source_url,
		excerpt = '',
		date = new Date().toISOString(),
		type = 'document',
		language = 'en',
		collection = 'Documents',
		chunkSize = 1000,
		chunkOverlap = 500,
	}: {
		title: string;
		content: string;
		source_url?: string;
		excerpt?: string;
		date?: string;
		type?: string;
		language?: string;
		collection?: string;
		chunkSize?: number;
		chunkOverlap?: number;
	}): Promise<boolean> {
		try {
			// Create a unique ID for the parent document
			const documentId = this.createId();

			// Create chunks with specified overlap
			const chunks = await this.langchainService.createChunks(
				content,
				chunkSize,
				chunkOverlap,
			);

			// Process each chunk
			for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
				let success = false;
				let attempts = 0;
				const maxAttempts = 3;

				while (!success && attempts < maxAttempts) {
					try {
						const textToEmbed = `TITLE: ${title}\n EXCERPT: ${excerpt}\n CONTENT: ${chunks[chunkIndex]}`;

						const embedding =
							await this.openAiService.getEmbeddings(textToEmbed);

						await this.insertDocument(collection, {
							title,
							content: chunks[chunkIndex],
							excerpt,
							date: new Date(date).toISOString(),
							source_url,
							type,
							vector: embedding,
							language,
							chunk_index: chunkIndex,
							total_chunks: chunks.length,
							parent_id: documentId,
						});

						success = true;
					} catch (error) {
						attempts++;
						console.error(
							`Error processing chunk ${chunkIndex} of ${title}:`,
							error,
						);

						if (error.response?.status === 429) {
							const waitTime = 15000 * attempts; // Progressive backoff
							this.logger.log(
								`Rate limit hit, waiting ${waitTime / 1000} seconds...`,
							);
							await new Promise((resolve) =>
								setTimeout(resolve, waitTime),
							);
						} else if (attempts === maxAttempts) {
							console.error(
								`Failed to process chunk ${chunkIndex} of ${title} after ${maxAttempts} attempts`,
							);
							throw error;
						} else {
							this.logger.log(
								`Retrying... Attempt ${attempts} of ${maxAttempts}`,
							);

							await new Promise((resolve) =>
								setTimeout(resolve, 2000 * attempts),
							);
						}
					}
				}
			}

			return true;
		} catch (error) {
			console.error(`Failed to process document: ${title}`, error);
			return false;
		}
	}

	async deleteDocument(collection: string): Promise<boolean> {
		try {
			const batchSize = 500;
			const maxAttempts = 3;

			this.logger.log(
				`Starting deletion of objects in class "${collection}"`,
			);

			while (true) {
				const result = await this.client.graphql
					.get()
					.withClassName(collection)
					.withFields('_additional { id }')
					.withLimit(batchSize)
					.withOffset(0) // always fetch from the start since we delete every batch
					.do();

				const currentBatch = result.data.Get[collection];

				if (!currentBatch || currentBatch.length === 0) {
					this.logger.log(
						`All objects from class "${collection}" have been deleted.`,
					);
					break;
				}

				for (const obj of currentBatch) {
					const id = obj?._additional?.id;
					if (!id) {
						console.warn(`Skipping object with missing ID:`, obj);
						continue;
					}

					let success = false;
					let attempts = 0;

					while (!success && attempts < maxAttempts) {
						try {
							await this.client.data
								.deleter()
								.withClassName(collection)
								.withId(id)
								.do();

							success = true;
						} catch (error) {
							attempts++;
							console.error(
								`Error deleting ID ${id} (Attempt ${attempts}):`,
								error.response?.data || error.message,
							);

							if (attempts === maxAttempts) {
								console.error(
									`Giving up on ID ${id} after ${maxAttempts} failed attempts.`,
								);
							} else {
								const delay = 1000 * attempts;
								await new Promise((resolve) =>
									setTimeout(resolve, delay),
								);
							}
						}
					}
				}
			}

			return true;
		} catch (error) {
			console.error(
				`Fatal error during deletion of class "${collection}":`,
				error,
			);
			return false;
		}
	}
}
