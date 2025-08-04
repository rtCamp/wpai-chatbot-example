import { Module } from '@nestjs/common';
import { PrismaService } from '@wpai-chatbot/prisma.service';

import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';

@Module({
	providers: [SessionsService, PrismaService],
	controllers: [SessionsController],
})
export class SessionsModule {}
