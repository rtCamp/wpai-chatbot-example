import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommandsModule } from './commands/commands.module';
import { OpenaiModule } from './openai/openai.module';
import { PineconeModule } from './pinecone/pinecone.module';
import { LangchainModule } from './langchain/langchain.module';
import { WeaviateModule } from './weaviate/weaviate.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			validationOptions: {
				abortEarly: false,
			},
		}),
		CommandsModule,
		OpenaiModule,
		PineconeModule,
		LangchainModule,
		WeaviateModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
