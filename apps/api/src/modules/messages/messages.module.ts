import { Module } from '@nestjs/common';
import { PrismaService } from '@wpai-chatbot/prisma.service';
import { BullModule } from '@nestjs/bullmq';
import { HttpModule } from '@nestjs/axios';
import { WeaviateModule } from '@wpai-chatbot/rag';

import { SummarizerService } from '../pipelines/ai/summarizer.service';

import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';

@Module({
	imports: [
		HttpModule,
		BullModule.registerQueue({
			name: 'message',
		}),
		WeaviateModule,
	],
	providers: [MessagesService, PrismaService, SummarizerService],
	controllers: [MessagesController],
})
export class MessagesModule {}
