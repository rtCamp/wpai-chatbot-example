import { CreateDocumentDto } from '@wpai-chatbot/dto/documents/create-document.dto';
import { WeaviateService } from '@wpai-chatbot/rag';
import {
	Controller,
	Post,
	Body,
	HttpStatus,
	HttpException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';

@ApiTags('Documents')
@Controller('documents')
export class DocumentsController {
	constructor(private readonly weaviateService: WeaviateService) {}

	@Post()
	@ApiOperation({ summary: 'Create and embed a new document in Weaviate' })
	@ApiBody({ type: CreateDocumentDto })
	@ApiResponse({
		status: 201,
		description: 'The document has been successfully created and embedded',
	})
	@ApiResponse({
		status: 400,
		description: 'Invalid input data',
	})
	@ApiResponse({
		status: 500,
		description: 'Internal server error during document processing',
	})
	async createDocument(@Body() createDocumentDto: CreateDocumentDto) {
		try {
			const doc = {
				...createDocumentDto,
				date: createDocumentDto.date || new Date().toISOString(),
				excerpt: createDocumentDto.excerpt || '',
				type: createDocumentDto.type || 'document',
				language: createDocumentDto.language || 'en',
				collection: createDocumentDto.collection || 'Documents',
				chunkSize: createDocumentDto.chunkSize || 1000,
				chunkOverlap: createDocumentDto.chunkOverlap || 500,
			};
			const success =
				await this.weaviateService.embedAndInsertDocument(doc);

			if (success) {
				return {
					message: 'Document successfully processed and embedded',
					title: createDocumentDto.title,
					status: 'success',
				};
			} else {
				throw new HttpException(
					'Failed to process document',
					HttpStatus.INTERNAL_SERVER_ERROR,
				);
			}
		} catch (error) {
			console.error('Error in createDocument controller:', error);
			throw new HttpException(
				error.message || 'Failed to process document',
				error.status || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}
}
