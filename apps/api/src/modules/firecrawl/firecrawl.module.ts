import { Module } from '@nestjs/common';
import { ScrapeService } from './scrape/scrape.service';
import { FirecrawlController } from './firecrawl.controller';
import { HttpModule } from '@nestjs/axios';
import { PrismaService } from '@wpai-chatbot/prisma.service';
import { WeaviateModule } from '@wpai-chatbot/rag';

@Module({
	imports: [HttpModule, WeaviateModule],
	providers: [ScrapeService, PrismaService],
	controllers: [FirecrawlController],
	exports: [ScrapeService],
})
export class FirecrawlModule {}
