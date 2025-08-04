import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { QueueOptions } from 'bullmq';
import { APP_GUARD } from '@nestjs/core';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PipelinesModule } from './modules/pipelines/pipelines.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { MessagesModule } from './modules/messages/messages.module';
import { ClientsModule } from './modules/clients/clients.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { FirecrawlModule } from './modules/firecrawl/firecrawl.module';
import { CronjobModule } from './modules/cronjob/cronjob.module';
import { SystemPromptsModule } from './modules/system-prompts/system-prompts.module';
import { DefaultPromptsModule } from './modules/default-prompts/default-prompts.module';
import { SharedChatModule } from './modules/shared-chat/shared-chat.module';
import { PromptPlaceholdersModule } from './modules/prompt-placeholders/prompt-placeholders.module';
import { DefaultPlaceholdersModule } from './modules/default-placeholders/default-placeholders.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			validationOptions: {
				abortEarly: false,
			},
		}),
		BullModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: async (
				config: ConfigService,
			): Promise<QueueOptions> => ({
				connection: {
					host: config.get('REDIS_HOST') || 'redis',
					port: parseInt(config.get('REDIS_PORT') || '6379'),
				},
				defaultJobOptions: {
					removeOnComplete: true,
				},
			}),
		}),
		ThrottlerModule.forRoot([
			{
				ttl: 60000,
				limit: 100,
			},
		]),
		PipelinesModule,
		SessionsModule,
		MessagesModule,
		ClientsModule,
		DocumentsModule,
		FirecrawlModule,
		CronjobModule,
		SystemPromptsModule,
		DefaultPromptsModule,
		SharedChatModule,
		PromptPlaceholdersModule,
		DefaultPlaceholdersModule,
	],
	controllers: [AppController],
	providers: [
		AppService,
		{
			provide: APP_GUARD,
			useClass: ThrottlerGuard,
		},
	],
})
export class AppModule {}
