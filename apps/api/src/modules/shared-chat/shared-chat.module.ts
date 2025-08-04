import { Module } from '@nestjs/common';

import { PrismaService } from '../../prisma.service';

import { SharedChatController } from './shared-chat.controller';
import { SharedChatService } from './shared-chat.service';

@Module({
	controllers: [SharedChatController],
	providers: [SharedChatService, PrismaService],
	exports: [SharedChatService],
})
export class SharedChatModule {}
