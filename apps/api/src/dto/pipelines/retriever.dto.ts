import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class RetrieveDataDto {
	@IsString()
	@IsNotEmpty()
	@ApiProperty({
		name: 'query',
		description: 'query to be sent to retriever',
		type: 'string',
		required: true,
	})
	query: string;

	@IsObject()
	@IsOptional()
	@ApiProperty({
		name: 'options',
		description: 'retrieval options',
		type: 'object',
		required: [],
		properties: {
			numResults: {
				type: 'number',
				description: 'Number of results to return',
				default: 3,
			},
			rerank: {
				type: 'boolean',
				description:
					'Whether to rerank results or just return similarity score',
			},
		},
	})
	options?: RetrievalOptions;
}
export class RetrieveDataFusionDto {
	@IsString()
	@IsNotEmpty()
	@ApiProperty({
		name: 'query',
		description: 'query to be sent to retriever',
		type: 'string',
		required: true,
	})
	query: string;

	@IsObject()
	@IsOptional()
	@ApiProperty({
		name: 'searchParams',
		description: 'search parameters for hybrid search',
		type: 'object',
		required: [],
		properties: {
			keywordQuery: {
				type: 'string',
				description: 'Query optimized for keyword search',
			},
			weights: {
				type: 'object',
				properties: {
					semantic: {
						type: 'number',
						description: 'Weight for semantic search (0-1)',
						default: 0.5,
					},
					keyword: {
						type: 'number',
						description: 'Weight for keyword search (0-1)',
						default: 0.5,
					},
				},
			},
		},
	})
	searchParams?: SearchParamsFusion;

	@IsObject()
	@IsOptional()
	@ApiProperty({
		name: 'options',
		description: 'retrieval options',
		type: 'object',
		required: [],
		properties: {
			numResults: {
				type: 'number',
				description: 'Number of results to return',
				default: 3,
			},
			rerank: {
				type: 'boolean',
				description:
					'Whether to rerank results or just return similarity score',
				default: false,
			},
		},
	})
	options?: RetrievalOptionsFusion;
}

interface SearchParamsFusion {
	keywordQuery?: string;
	weights?: {
		semantic: number;
		keyword: number;
	};
}

interface RetrievalOptionsFusion {
	numResults?: number;
	rerank?: boolean;
}

interface RetrievalOptions {
	numResults?: number;
	rerank?: boolean;
}
