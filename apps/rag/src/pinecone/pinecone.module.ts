import { Module } from '@nestjs/common';
import { OpenaiModule } from '@rag/openai/openai.module';
import { LangchainModule } from '@rag/langchain/langchain.module';
import { ConfigModule } from '@nestjs/config';

import { PineconeService } from './pinecone.service';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		OpenaiModule,
		LangchainModule,
	],
	providers: [PineconeService],
	exports: [PineconeService],
})
export class PineconeModule {}
