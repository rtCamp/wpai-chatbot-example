import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bullmq';
import { PrismaService } from '@wpai-chatbot/prisma.service';
import { ConfigModule } from '@nestjs/config';
import {
	OpenaiModule,
	PineconeModule,
	WeaviateModule,
} from '@wpai-chatbot/rag';

import { MessagesService } from '../messages/messages.service';
import { SessionsService } from '../sessions/sessions.service';
import { FirecrawlModule } from '../firecrawl/firecrawl.module';

import { MessageConsumer } from './message.consumer';
import { SummarizerService } from './ai/summarizer.service';
import { NerService } from './ai/ner.service';
import { RetrieverService } from './ai/retriever.service';
import { PipelinesController } from './pipelines.controller';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		OpenaiModule,
		PineconeModule,
		WeaviateModule,
		HttpModule,
		BullModule.registerQueue({
			name: 'message',
		}),
		FirecrawlModule,
	],
	providers: [
		RetrieverService,
		NerService,
		SummarizerService,
		PrismaService,
		MessageConsumer,
		MessagesService,
		SessionsService,
	],
	exports: [RetrieverService, NerService, SummarizerService],
	controllers: [PipelinesController],
})
export class PipelinesModule {}
