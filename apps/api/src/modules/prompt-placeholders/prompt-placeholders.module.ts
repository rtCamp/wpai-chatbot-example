import { Module } from '@nestjs/common';
import { PrismaService } from '@wpai-chatbot/prisma.service';

import { PromptPlaceholdersService } from './prompt-placeholders.service';
import { PromptPlaceholdersController } from './prompt-placeholders.controller';

@Module({
	controllers: [PromptPlaceholdersController],
	providers: [PromptPlaceholdersService, PrismaService],
	exports: [PromptPlaceholdersService],
})
export class PromptPlaceholdersModule {}
