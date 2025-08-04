export interface RelatedDocument {
	id: string;
	similarity?: number;
	source_url: string;
	date: string;
	text: string;
	type: string;
	title: string;
	excerpt?: string;
	chunk_index?: number;
	total_chunks?: number;
	parent_id?: string;
}

export interface RelatedDocumentNormal {
	id: string;
	chunk_index: string;
	similarity: number;
	source_url: string;
	date: string;
	text: string;
	total_chunks: string;
	type: string;
	relevance?: number;
}

export interface RetrievalResponse {
	question: string;
	related_documents: RelatedDocument[];
	numResults: number;
	searchMetadata?: {
		originalQuery: string;
		usedSemanticQuery: string;
		usedKeywordQuery: string;
		semanticWeight: number;
		keywordWeight: number;
	};
}

export interface RetrievalResponseNormal {
	numResults: number;
	question: string;
	related_documents: RelatedDocument[];
	rerank?: boolean;
}

export interface VectorizeRetrievalResponse {
	record: {
		value: string;
	};
}
