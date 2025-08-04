/**
 * @deprecated
 * This PineconeService is deprecated and should not be used in new implementations.
 */
import { readFile } from 'fs/promises';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { init } from '@paralleldrive/cuid2';
import { Index, Pinecone } from '@pinecone-database/pinecone';
import { LangchainService } from '@rag/langchain/langchain.service';
import { OpenaiService } from '@rag/openai/openai.service';

@Injectable()
export class PineconeService {
	private readonly pc: Pinecone;
	private readonly indexHost: string;
	private readonly index: Index;
	private readonly namespace: string = 'rtcamp_com_v2';
	private readonly createId: () => string;

	constructor(
		private readonly configService: ConfigService,
		private readonly openaiService: OpenaiService,
		private readonly langchainService: LangchainService,
	) {
		const apiKey = this.configService.get<string>('PINECONE_API_KEY');
		if (!apiKey) {
			throw new Error('PINECONE_API_KEY is required');
		}

		this.pc = new Pinecone({
			apiKey,
		});

		const indexHost = this.configService.get<string>('PINECONE_INDEX_HOST');

		if (!indexHost) {
			throw new Error('PINECONE_INDEX_HOST is required');
		}

		this.indexHost = indexHost;

		this.index = this.pc.index('wpai-chatbot', this.indexHost);

		this.createId = init({ length: 10 });
	}

	async upsertDoc(id: string, text: string, meta: Record<string, any>) {
		const embeddings = await this.openaiService.getEmbeddings(text);

		const record = {
			id,
			values: embeddings,
			metadata: {
				text,
				...meta,
			},
		};

		try {
			await this.index.namespace(this.namespace).upsert([record]);
		} catch (error) {
			console.error('Error upserting document:', error);
			throw error;
		}
	}

	async retrieve(
		namespace: string,
		vector: number[],
		filter?: Record<string, any>,
		topK: number = 5,
	) {
		const queryParams = {
			vector,
			topK,
			includeMetadata: true,
		};

		if (filter && Object.keys(filter).length > 0) {
			queryParams['filter'] = filter;
		}

		try {
			const docs = await this.index
				.namespace(namespace)
				.query(queryParams);
			return docs;
		} catch (error) {
			console.error('Error retrieving documents:', error);
			throw error;
		}
	}

	async rerank(
		documents: (string | { [key: string]: string })[],
		query: string,
		topN: number = 5,
	) {
		const rerankingModel = 'bge-reranker-v2-m3';

		const rerankOptions = {
			topN,
			returnDocuments: true,
			parameters: {
				truncate: 'END',
			},
		};

		const response = await this.pc.inference.rerank(
			rerankingModel,
			query,
			documents,
			rerankOptions,
		);

		return response;
	}

	async loadJsonIntoPinecone(jsonPath: string) {
		const data = JSON.parse(await readFile(jsonPath, 'utf8'));

		for (let i = 0; i < data.length; i += 10) {
			const batch = data.slice(i, i + 10);

			await Promise.all(
				batch.map(async (item) => {
					const documentId = this.createId();
					const chunks = await this.langchainService.createChunks(
						item.content,
						600,
						300,
					);

					await Promise.all(
						chunks.map(async (chunk, index) => {
							let success = false;
							while (!success) {
								try {
									await this.upsertDoc(
										`${documentId}_chunk_${index}`,
										chunk,
										{
											date: item.date,
											source_url: item.link,
											type: item.type,
											chunk_index: index,
											total_chunks: chunks.length,
											parent_id: documentId,
										},
									);
									success = true;
								} catch (error) {
									if (error.response?.status === 429) {
										console.warn(
											'Rate limit hit, waiting 10 seconds...',
										);
										await new Promise((resolve) =>
											setTimeout(resolve, 10000),
										);
									} else {
										throw error;
									}
								}
							}
						}),
					);
				}),
			);

			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
	}
}
