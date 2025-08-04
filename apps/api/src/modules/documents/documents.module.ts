import { Module } from '@nestjs/common';
import {
	OpenaiModule,
	PineconeModule,
	WeaviateModule,
} from '@wpai-chatbot/rag';

import { DocumentsController } from './documents.controller';

@Module({
	imports: [OpenaiModule, PineconeModule, WeaviateModule],
	controllers: [DocumentsController],
})
export class DocumentsModule {}
