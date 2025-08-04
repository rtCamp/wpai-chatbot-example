import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { PineconeModule } from '@rag/pinecone/pinecone.module';
import { WeaviateModule } from '@rag/weaviate/weaviate.module';

import { LoadJsonCommand } from './load-json.command';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		HttpModule,
		PineconeModule,
		WeaviateModule,
	],
	providers: [LoadJsonCommand],
})
export class CommandsModule {}
