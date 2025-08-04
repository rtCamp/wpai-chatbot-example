import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@wpai-chatbot/prisma.service';

import { ScrapeService } from '../firecrawl/scrape/scrape.service';

@Injectable()
export class CronjobService {
	private readonly logger = new Logger(CronjobService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly scraperService: ScrapeService,
	) {}

	@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
	async handleDailyCrawls() {
		await this.runScheduledCrawls('daily');
		await this.runScheduledScrapes('daily');
		await this.runScheduledDocsScrapes('daily');
	}

	@Cron(CronExpression.EVERY_WEEK)
	async handleWeeklyCrawls() {
		await this.runScheduledCrawls('weekly');
		await this.runScheduledScrapes('weekly');
		await this.runScheduledDocsScrapes('weekly');
	}

	@Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
	async handleMonthlyCrawls() {
		await this.runScheduledCrawls('monthly');
		await this.runScheduledScrapes('monthly');
		await this.runScheduledDocsScrapes('monthly');
	}

	@Cron(CronExpression.EVERY_YEAR)
	async handleYearlyCrawls() {
		await this.runScheduledCrawls('yearly');
		await this.runScheduledScrapes('yearly');
		await this.runScheduledDocsScrapes('yearly');
	}

	private async runScheduledCrawls(frequency: string) {
		const urls = await this.prisma.integratedWebsites.findMany({
			where: { frequency },
		});

		this.logger.log(`Running ${frequency} crawl for ${urls.length} URLs`);

		for (const { url, collection } of urls) {
			let status = 'success';
			let errorMessage = '';
			let finalLogs = [];
			try {
				const { logs } = await this.scraperService.crawlAndPopulate(
					url,
					collection,
				);
				finalLogs = logs;
				this.logger.log(`Crawled: ${url}`);
			} catch (e) {
				this.logger.error(`Failed to crawl ${url}: ${e.message}`);
				finalLogs.push(`Error: ${e.message}`);
				status = 'error';
				errorMessage = e.message;
			} finally {
				await this.prisma.cronHistory.upsert({
					where: {
						url: url,
					},
					update: {
						logs: finalLogs.join('\n'),
						status,
						errorMessage,
						lastScrapedAt: new Date(),
					},
					create: {
						url: url,
						logs: finalLogs.join('\n'),
						status,
						errorMessage,
						lastScrapedAt: new Date(),
					},
				});
			}
		}
	}

	private async runScheduledScrapes(frequency: string) {
		const urls = await this.prisma.scrapeUrls.findMany({
			where: { frequency },
		});

		this.logger.log(`Running ${frequency} scrape for ${urls.length} URLs`);

		for (const { url } of urls) {
			const finalLogs = [];
			let status = 'success';
			let errorMessage = '';
			try {
				await this.scraperService.scrapeUrl(url, 'single url');
				this.logger.log(`Scraped: ${url}`);
				finalLogs.push(`Scraped: ${url}`);
			} catch (e) {
				this.logger.error(`Failed to scrape ${url}: ${e.message}`);
				finalLogs.push(`Error: ${e.message}`);
				status = 'error';
				errorMessage = e.message;
			} finally {
				await this.prisma.cronHistory.upsert({
					where: {
						url: url,
					},
					update: {
						logs: finalLogs.join('\n'),
						status,
						errorMessage,
						lastScrapedAt: new Date(),
					},
					create: {
						url: url,
						logs: finalLogs.join('\n'),
						status,
						errorMessage,
						lastScrapedAt: new Date(),
					},
				});
			}
		}
	}

	private async runScheduledDocsScrapes(frequency: string) {
		const urls = await this.prisma.docsUrls.findMany({
			where: { frequency },
		});

		this.logger.log(
			`Running ${frequency} Google Docs scrape for ${urls.length} URLs`,
		);

		for (const { url } of urls) {
			const finalLogs = [];
			let status = 'success';
			let errorMessage = '';
			try {
				await this.scraperService.scrapeDocs(url);
				this.logger.log(`Scraped: ${url}`);
				finalLogs.push(`Scraped: ${url}`);
			} catch (e) {
				this.logger.error(`Failed to scrape ${url}: ${e.message}`);
				finalLogs.push(`Error: ${e.message}`);
				status = 'error';
				errorMessage = e.message;
			} finally {
				await this.prisma.cronHistory.upsert({
					where: {
						url: url,
					},
					update: {
						logs: finalLogs.join('\n'),
						status,
						errorMessage,
						lastScrapedAt: new Date(),
					},
					create: {
						url: url,
						logs: finalLogs.join('\n'),
						status,
						errorMessage,
						lastScrapedAt: new Date(),
					},
				});
			}
		}
	}
}
