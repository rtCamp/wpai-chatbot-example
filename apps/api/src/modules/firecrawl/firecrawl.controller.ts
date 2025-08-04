import { Body, Controller, Get, Post, UseGuards, Res } from '@nestjs/common';
import { ScrapeService } from './scrape/scrape.service';
import {
	ScrapeDto,
	ScrapeMultipleDto,
	ScrapeUrl,
} from '@wpai-chatbot/dto/firecrawl/scrape.dto';
import { PrismaService } from '@wpai-chatbot/prisma.service';
import { ApiKeyGuard } from '@wpai-chatbot/guards/api-key.guard';
import { ApiTags, ApiSecurity } from '@nestjs/swagger';
import { Response } from 'express';

@Controller('firecrawl')
@UseGuards(ApiKeyGuard)
@ApiTags('Sessions')
@ApiSecurity('api-key')
export class FirecrawlController {
	constructor(
		private readonly scraperService: ScrapeService,
		private readonly prismaService: PrismaService,
	) {}

	@Post('/scrape')
	async scrapeUrl(@Body() payload: ScrapeDto) {
		const { url } = payload;

		return await this.scraperService.scrapeUrl(url, 'single url');
	}

	@Post('/scrape-multiple')
	async scrapeUrls(@Body() payload: ScrapeMultipleDto) {
		const { urls, userId } = payload;

		return await this.scraperService.scrapeMultipleUrls(urls);
	}

	@Post('/crawl-website')
	async crawlWebsite(@Body() payload: ScrapeDto, @Res() res: Response) {
		const { url } = payload;
		res.setHeader('Content-Type', 'application/json');
		res.setHeader('Transfer-Encoding', 'chunked');

		res.write(`{ "status": "started" }\n`);
		try {
			const existingUrl =
				await this.prismaService.integratedWebsites.findUnique({
					where: { url },
				});
			if (!existingUrl) {
				throw new Error('URL does not exist in the database.');
			}
			const result = await this.scraperService.streamCrawlWebsite(
				url,
				(update) => {
					res.write(`${JSON.stringify(update)}\n`);
				},
			);

			const totalInserted =
				await this.scraperService.populateCrawlWeaviateWithProgress(
					result,
					url,
					existingUrl.collection,
					(progress) => res.write(`${JSON.stringify(progress)}\n`),
				);

			res.write(
				`${JSON.stringify({ status: 'completed', totalInserted })}\n`,
			);
			res.end();
			await this.prismaService.integratedWebsites.update({
				where: { url },
				data: { status: 'crawled', updatedAt: new Date() },
			});
		} catch (error) {
			res.write(
				JSON.stringify({
					status: 'error',
					message: error.message,
				}) + '\n',
			);
			res.end();
			await this.prismaService.integratedWebsites.update({
				where: { url },
				data: {
					status: 'failed',
					updatedAt: new Date(),
					errorMessage: error.message,
				},
			});
		}
	}

	@Post('/add-url')
	async addUrl(@Body() payload: ScrapeUrl) {
		const { url } = payload;

		return await this.scraperService.addUrl(url);
	}

	@Get('/get-urls')
	async getUrls() {
		return await this.scraperService.getUrls();
	}

	@Post('/add-crawl-url')
	async addCrawlUrl(@Body() payload: ScrapeUrl) {
		const { url } = payload;

		return await this.scraperService.addCrawlUrl(url);
	}

	@Get('/get-crawl-urls')
	async getCrawlUrls() {
		return await this.scraperService.getCrawlUrls();
	}

	@Post('/add-docs-url')
	async addDocsUrl(@Body() payload: ScrapeUrl) {
		const { url } = payload;

		return await this.scraperService.addDocsUrl(url);
	}

	@Get('/get-docs-urls')
	async getDocsUrls() {
		return await this.scraperService.getDocsUrl();
	}

	@Post('/set-crawl-frequency')
	async setFrequency(@Body() payload: { url: string; frequency: string }) {
		const { url, frequency } = payload;

		return await this.scraperService.setCrawlFrequency(url, frequency);
	}

	@Post('/set-frequency')
	async setScrapeFrequency(
		@Body() payload: { url: string; frequency: string },
	) {
		const { url, frequency } = payload;

		return await this.scraperService.setFrequency(url, frequency);
	}

	@Post('/set-docs-frequency')
	async setDocsFrequency(
		@Body() payload: { url: string; frequency: string },
	) {
		const { url, frequency } = payload;

		return await this.scraperService.setDocsFrequency(url, frequency);
	}

	@Post('/scrape-docs')
	async scrapeDocs(@Body() payload: { url: string }) {
		const { url } = payload;
		return await this.scraperService.scrapeDocs(url);
	}

	@Post('/set-integrated-website-frequency')
	async setIntegratedWebsiteFrequency(
		@Body() payload: { url: string; frequency: string },
	) {
		const { url, frequency } = payload;

		return await this.scraperService.setIntegratedWebsiteFrequency(
			url,
			frequency,
		);
	}

	@Post('/add-integrate-website')
	async integrateWebsite(@Body() payload: { url: string }) {
		const { url } = payload;
		return await this.scraperService.addIntegratedWebsite(url);
	}

	@Get('/get-integrated-websites')
	async getIntegratedWebsites() {
		return await this.scraperService.getIntegratedWebsites();
	}

	@Post('/delete-integrated-website')
	async deleteIntegratedWebsite(@Body() payload: { url: string }) {
		const { url } = payload;
		return await this.scraperService.deleteIntegratedWebsite(url);
	}

	@Post('/check-docs-permission')
	async checkDocsPermission(
		@Body() payload: { url: string; userEmail: string },
	) {
		const { url, userEmail } = payload;
		return await this.scraperService.checkDocsPermission(url, userEmail);
	}
}
