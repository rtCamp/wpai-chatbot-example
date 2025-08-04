import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaService } from '@wpai-chatbot/prisma.service';

import { FirecrawlModule } from '../firecrawl/firecrawl.module';

import { CronjobService } from './cronjob.service';

@Module({
	imports: [ScheduleModule.forRoot(), FirecrawlModule],
	providers: [CronjobService, PrismaService],
})
export class CronjobModule {}
