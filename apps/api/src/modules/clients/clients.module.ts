import { Module } from '@nestjs/common';
import { PrismaService } from '@wpai-chatbot/prisma.service';

import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';

@Module({
	imports: [],
	providers: [ClientsService, PrismaService],
	controllers: [ClientsController],
})
export class ClientsModule {}
