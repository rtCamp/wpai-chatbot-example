export interface ParsedSource {
	source_url: string;
	date: string;
	text: string;
	type?: string;
	title?: string;
	excerpt?: string;
}

export interface ParsedRetrievalResult {
	question: string;
	related_documents: ParsedSource[];
	numResults: number;
	searchMetadata: {
		originalQuery: string;
		usedSemanticQuery: string;
		usedKeywordQuery: string;
		semanticWeight: number;
		keywordWeight: number;
		totalCandidates: number;
	};
}

export function parseRetrievalResult(
	jsonString?: string,
): ParsedRetrievalResult | null {
	if (!jsonString) return null;

	try {
		return JSON.parse(jsonString);
	} catch (e) {
		console.error('Failed to parse retrieval result', e);
		return null;
	}
}
