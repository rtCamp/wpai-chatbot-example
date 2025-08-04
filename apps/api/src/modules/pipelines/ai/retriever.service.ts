import { Injectable } from '@nestjs/common';
import { RetrieveDataDto } from '@wpai-chatbot/dto/pipelines/retriever.dto';
import {
	RelatedDocument,
	RelatedDocumentNormal,
	RetrievalResponse,
	RetrievalResponseNormal,
} from 'src/interfaces/retriever.interface';
import {
	OpenaiService,
	PineconeService,
	WeaviateService,
} from '@wpai-chatbot/rag';

@Injectable()
export class RetrieverService {
	constructor(
		private readonly openaiService: OpenaiService,
		private readonly pineconeService: PineconeService,
		private readonly weaviateService: WeaviateService,
	) {}

	private async genereateEmbedding(text: string) {
		const embedding = await this.openaiService.getEmbeddings(text);
		return embedding;
	}

	async retrieveData({
		query,
		options = { rerank: true, numResults: 5 },
	}: RetrieveDataDto): Promise<RetrievalResponseNormal> {
		try {
			// Generate embeddings
			const embeddings = await this.genereateEmbedding(query);

			// Retrieve documents
			const docs = await this.pineconeService.retrieve(
				'rtcamp_com',
				embeddings,
				null,
				options.numResults,
			);

			// Transform docs
			const transformedDocs: RelatedDocumentNormal[] = docs.matches.map(
				(match) => ({
					id: match.id,
					chunk_index: String(match.metadata.chunk_index),
					total_chunks: String(match.metadata.total_chunks),
					similarity: match.score,
					source_url: this.addUtmParameter(
						String(match.metadata.source_url),
					),
					date: String(match.metadata.date),
					text: String(match.metadata.text),
					type: String(match.metadata.type),
				}),
			);

			// If reranking is true, rerank
			const rerankedDocs = await this.pineconeService.rerank(
				transformedDocs as unknown as (
					| string
					| { [key: string]: string }
				)[],
				query,
				options.numResults,
			);

			const retrievedDocsReranked = rerankedDocs.data
				.map((item) => ({
					...(item.document as unknown as Omit<
						RelatedDocument,
						'relevance'
					>),
					relevance: item.score,
				}))
				.sort((a, b) => b.relevance - a.relevance);

			const response: RetrievalResponseNormal = {
				question: query,
				related_documents: retrievedDocsReranked,
				rerank: options.rerank,
				numResults: retrievedDocsReranked.length,
			};

			return response;
		} catch (error) {
			console.error(error);
		}
	}

	async retrieveFusion({
		query,
		searchParams,
		options = { numResults: 5 },
	}: {
		query: string;
		searchParams?: {
			keywordQuery: string;
			weights: {
				semantic: number;
				keyword: number;
			};
		};
		options?: { numResults: number };
	}): Promise<RetrievalResponse> {
		try {
			const docs = await this.weaviateService.searchFusion(
				{
					rewrittenQuery: null,
					expandedQuery: query,
					keywords: [],
					hybridSearchParams: {
						semanticQuery: query,
						keywordQuery: searchParams?.keywordQuery || query,
						suggestedWeights: searchParams?.weights || {
							semantic: 0.5,
							keyword: 0.5,
						},
					},
				},
				options.numResults,
			);

			const transformedDocs: RelatedDocument[] = docs.results.map(
				(doc) => ({
					id: doc._additional.id,
					similarity: doc._additional.certainty,
					source_url: this.addUtmParameter(String(doc.source_url)),
					date: doc.date,
					text: doc.content,
					type: doc.type,
					title: doc.title,
					excerpt: doc.excerpt,
					chunk_index: doc.chunk_index,
					total_chunks: doc.total_chunks,
					parent_id: doc.parent_id,
				}),
			);

			const response: RetrievalResponse = {
				question: query,
				related_documents: transformedDocs,
				numResults: transformedDocs.length,
				searchMetadata: docs.queryMetadata,
			};

			return response;
		} catch (error) {
			console.error('Error in retrieveFusion:', error);
			throw error;
		}
	}

	async retrieveRRF({
		query,
		searchParams,
		options = { numResults: 5 },
	}: {
		query: string;
		searchParams?: {
			keywordQuery: string;
			weights: {
				semantic: number;
				keyword: number;
			};
		};
		options?: { numResults: number };
	}): Promise<RetrievalResponse> {
		try {
			const docs = await this.weaviateService.searchWithRRF(
				{
					rewrittenQuery: null,
					expandedQuery: query,
					keywords: [],
					hybridSearchParams: {
						semanticQuery: query,
						keywordQuery: searchParams?.keywordQuery || query,
						suggestedWeights: searchParams?.weights || {
							semantic: 0.5,
							keyword: 0.5,
						},
					},
				},
				options.numResults,
			);

			const transformedDocs: RelatedDocument[] = docs.results.map(
				(doc) => ({
					id: doc.id,
					similarity: doc.score,
					source_url: this.addUtmParameter(String(doc.source_url)),
					date: doc.date,
					text: doc.content,
					type: doc.type,
					title: doc.title,
					excerpt: doc.excerpt,
					chunk_index: doc.chunk_index,
					total_chunks: doc.total_chunks,
					parent_id: doc.parent_id,
				}),
			);

			const response: RetrievalResponse = {
				question: query,
				related_documents: transformedDocs,
				numResults: transformedDocs.length,
				searchMetadata: docs.queryMetadata,
			};

			return response;
		} catch (error) {
			console.error('Error in retrieveRRF:', error);
			throw error;
		}
	}

	private async parseRetrieval(
		jsonString: string,
	): Promise<RetrievalResponse> {
		const parsed = JSON.parse(jsonString);
		return parsed;
	}

	private addUtmParameter(url: string): string {
		if (!url) return url;

		try {
			const urlObj = new URL(url);

			// Add utm_source=wpai-chatbot parameter
			urlObj.searchParams.append('utm_source', 'wpai-chatbot');

			return urlObj.toString();
		} catch {
			// If URL parsing fails, handle it manually
			if (url.includes('?')) {
				return `${url}&utm_source=wpai-chatbot`;
			} else {
				return `${url}?utm_source=wpai-chatbot`;
			}
		}
	}
}
