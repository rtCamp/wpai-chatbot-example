import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
	IsString,
	IsNumber,
	IsArray,
	ValidateNested,
	IsNotEmpty,
	IsOptional,
	IsBoolean,
} from 'class-validator';

class RelatedDocument {
	@ApiProperty({
		name: 'similarity',
		description: 'Similarity score (0.0-1.0)',
		type: 'number',
	})
	@IsNumber()
	similarity: number;

	@ApiProperty({
		name: 'source_url',
		type: 'string',
	})
	@IsString()
	source_url: string;

	@ApiProperty({
		name: 'date',
		type: 'string',
	})
	@IsString()
	date: string;

	@ApiProperty({
		name: 'text',
		type: 'string',
	})
	@IsString()
	text: string;

	@ApiProperty({
		name: 'type',
		type: 'string',
	})
	@IsString()
	type: string;

	@ApiProperty({
		name: 'relevance',
		required: false,
		type: 'number',
	})
	@IsOptional()
	@IsNumber()
	relevance?: number;

	@ApiProperty({
		name: 'chunk_index',
		required: false,
		type: 'string',
	})
	@IsOptional()
	@IsString()
	excerpt?: string;
}

export class SummarizeDto {
	@ApiProperty({
		name: 'question',
		description: 'User query',
		type: 'string',
	})
	@IsString()
	@IsNotEmpty()
	question: string;

	@ApiProperty({
		name: 'related_documents',
		type: [RelatedDocument],
	})
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => RelatedDocument)
	related_documents: Partial<RelatedDocument>[];

	@ApiProperty({
		name: 'decay',
		description: 'Should freshness of results be considered?',
		type: 'boolean',
		default: false,
	})
	@IsBoolean()
	@IsOptional()
	decay?: boolean;

	@ApiProperty({
		name: 'cohere_ndcg',
		description: 'NDCG Score (0.0-1.0)',
		type: 'number',
		minimum: 0,
		maximum: 1,
	})
	@IsNumber()
	@IsOptional()
	cohere_ndcg?: number;

	@ApiProperty({
		name: 'cohere_avg',
		description: 'Avg cohere score (0.0-1.0)',
		type: 'number',
		minimum: 0,
		maximum: 1,
	})
	@IsNumber()
	@IsOptional()
	cohere_avg?: number;

	@ApiProperty({
		name: 'original query',
		description: 'User original query',
		type: 'string',
	})
	@IsString()
	@IsOptional()
	originalQuery?: string;

	@ApiProperty({
		name: 'original query',
		description: 'Current page content',
		type: 'string',
	})
	@IsString()
	@IsOptional()
	pageContent?: string;
}
