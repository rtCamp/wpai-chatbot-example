import { Module } from '@nestjs/common';

import { PrismaService } from '../../prisma.service';

import { SystemPromptsController } from './system-prompts.controller';
import { SystemPromptsService } from './system-prompts.service';

@Module({
	controllers: [SystemPromptsController],
	providers: [SystemPromptsService, PrismaService],
	exports: [SystemPromptsService],
})
export class SystemPromptsModule {}
