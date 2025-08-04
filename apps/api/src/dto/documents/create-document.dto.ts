import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateDocumentDto {
	@ApiProperty({
		description: 'Document title',
		example: 'How to use Weaviate',
	})
	@IsNotEmpty({ message: 'Title is required' })
	@IsString()
	title: string;

	@ApiProperty({
		description: 'Document content text',
		example: 'Weaviate is a vector database...',
	})
	@IsNotEmpty({
		message: 'Content is required and must be a non-empty string',
	})
	@IsString()
	content: string;

	@ApiProperty({
		description: 'Source URL of the document (optional)',
		example: 'https://example.com/article',
		required: false,
	})
	@IsOptional()
	@IsString()
	source_url?: string;

	@ApiProperty({
		description: 'Document excerpt or summary (optional)',
		example: 'A brief introduction to vector databases',
		required: false,
	})
	@IsOptional()
	@IsString()
	excerpt?: string;

	@ApiProperty({
		description: 'Document date (optional)',
		example: '2025-03-04T12:00:00.000Z',
		required: false,
	})
	@IsOptional()
	@IsString()
	date?: string;

	@ApiProperty({
		description: 'Document type (optional)',
		example: 'article',
		required: false,
	})
	@IsOptional()
	@IsString()
	type?: string;

	@ApiProperty({
		description: 'Document language (optional)',
		example: 'en',
		default: 'en',
		required: false,
	})
	@IsOptional()
	@IsString()
	language?: string;

	@ApiProperty({
		description: 'Weaviate collection name (optional)',
		example: 'Documents',
		default: 'Documents',
		required: false,
	})
	@IsOptional()
	@IsString()
	collection?: string;

	@ApiProperty({
		description: 'Chunk size for text splitting (optional)',
		example: 1000,
		default: 1000,
		required: false,
	})
	@IsOptional()
	@IsNumber()
	chunkSize?: number;

	@ApiProperty({
		description: 'Chunk overlap for text splitting (optional)',
		example: 500,
		default: 500,
		required: false,
	})
	@IsOptional()
	@IsNumber()
	chunkOverlap?: number;
}
