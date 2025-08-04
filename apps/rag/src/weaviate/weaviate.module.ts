import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OpenaiModule } from '@rag/openai/openai.module';
import { LangchainModule } from '@rag/langchain/langchain.module';

import { WeaviateService } from './weaviate.service';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		OpenaiModule,
		LangchainModule,
	],
	providers: [WeaviateService],
	exports: [WeaviateService],
})
export class WeaviateModule {}
