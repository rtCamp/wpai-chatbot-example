import {
	Injectable,
	InternalServerErrorException,
	BadRequestException,
	Logger,
	HttpException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, catchError } from 'rxjs';
import { AxiosError } from 'axios';
import { PrismaService } from '@wpai-chatbot/prisma.service';
import { diffLines } from 'diff';
import { WeaviateService } from '@wpai-chatbot/rag';
import { google } from 'googleapis';
import { marked } from 'marked';
import * as sanitizeHtml from 'sanitize-html';
import { randomBytes } from 'crypto';

export interface FirecrawlResponse {
	url: string;
	title: string;
	markdown: string;
	excerpt: string;
}

@Injectable()
export class ScrapeService {
	private readonly logger = new Logger(ScrapeService.name);

	constructor(
		private prisma: PrismaService,
		private readonly httpService: HttpService,
		private readonly configService: ConfigService,
		private readonly weaviateService: WeaviateService,
	) {}

	async scrape(url: string, scarapeType: string) {
		const firecrawlUrl = process.env.FIRECRAWL_ENDPOINT;
		try {
			const { data: result } = await firstValueFrom(
				this.httpService
					.post(
						`${firecrawlUrl}/v1/scrape`,
						{ url, formats: ['markdown'] },
						{
							headers: { 'Content-Type': 'application/json' },
						},
					)
					.pipe(
						catchError((error: AxiosError) => {
							throw new InternalServerErrorException(
								`Failed to scrape URL: ${error.response?.status || ''} ${error.message}`,
							);
						}),
					),
			);

			if (!result?.data?.markdown) {
				await this.prisma.scrapeHistory.upsert({
					where: {
						url: url, // assumes `url` is unique or marked with `@unique` in the schema
					},
					update: {
						content: result.data.markdown,
						status: 'failed',
						type: scarapeType,
						errorMessage:
							'Markdown content missing from Firecrawl response',
						updatedAt: new Date(),
					},
					create: {
						url: url,
						content: result.data.markdown,
						status: 'failed',
						type: scarapeType,
						errorMessage:
							'Markdown content missing from Firecrawl response',
						updatedAt: new Date(),
					},
				});
				throw new InternalServerErrorException(
					'Markdown content missing from Firecrawl response',
				);
			}

			return result;
		} catch (error) {
			throw error;
		}
	}

	async scrapeUrl(
		url: string,
		scarapeType: string,
	): Promise<FirecrawlResponse> {
		try {
			const result = await this.scrape(url, scarapeType);

			result.data.markdown = await this.parseMarkdown(
				result.data.markdown,
			);

			// Check if the URL is already in the database.
			const existingUrl = await this.prisma.scrapeUrls.findUnique({
				where: { url },
			});

			// If the URL does not exist, throw an error.
			if (!existingUrl) {
				throw new InternalServerErrorException(
					'URL does not exist in the database.',
				);
			}

			// Check if this URL already exists in the scrape_runs table
			const existingScrapeRun = await this.prisma.scrapeRun.findUnique({
				where: { url },
			});

			if (existingScrapeRun) {
				// If exists, check if the markdown content has changed
				if (existingScrapeRun.data !== result.data.markdown) {
					// Compare the existing markdown with the new one.
					const diffLinesResult = diffLines(
						existingScrapeRun.data,
						result.data.markdown,
					);

					// Filter out the added lines.
					const addedContent = diffLinesResult
						.filter((part) => part.added)
						.map((part) => part.value)
						.join('')
						.split('\n')
						.filter(
							(line) => !/^Last updated on/i.test(line.trim()),
						) // ignore lines like "Last updated on ..."
						.join('\n');

					// If there are any added lines, proceed to update the database.
					if (addedContent.trim()) {
						const success =
							await this.weaviateService.embedAndInsertDocument({
								title: result.data.metadata?.title || '',
								content: addedContent.trim(),
								source_url: url,
								excerpt:
									result.data.metadata?.description || '',
								date: new Date().toISOString(),
								type: 'page',
								language: 'en',
								collection: 'RtCampCom',
								chunkSize: 1000,
								chunkOverlap: 500,
							});

						if (!success) {
							await this.prisma.scrapeUrls.update({
								where: { url },
								data: {
									status: 'failed',
									errorMessage:
										'Failed to embed and insert document into Weaviate',
									updatedAt: new Date(),
								},
							});

							// Create a new entry in the scrape history.
							await this.prisma.scrapeHistory.upsert({
								where: {
									url: url, // assumes `url` is unique or marked with `@unique` in the schema
								},
								update: {
									content: result.data.markdown,
									status: 'failed',
									type: scarapeType,
									errorMessage:
										'Failed to embed and insert document into Weaviate',
									updatedAt: new Date(),
								},
								create: {
									url: url,
									content: result.data.markdown,
									status: 'failed',
									type: scarapeType,
									errorMessage:
										'Failed to embed and insert document into Weaviate',
									updatedAt: new Date(),
								},
							});

							throw new InternalServerErrorException(
								'Failed to embed and insert document into Weaviate',
							);
						}
						// Update the existing record only if the markdown is different
						await this.prisma.scrapeRun.update({
							where: { url },
							data: {
								data: result.data.markdown, // Update only the markdown content
								updatedAt: new Date(), // Update the timestamp
							},
						});

						// Update the scrape URL status.
						await this.prisma.scrapeUrls.update({
							where: { url },
							data: { status: 'scraped', updatedAt: new Date() },
						});

						// Create a new entry in the scrape history.
						await this.prisma.scrapeHistory.upsert({
							where: {
								url: url, // assumes `url` is unique or marked with `@unique` in the schema
							},
							update: {
								content: result.data.markdown,
								status: 'success',
								type: scarapeType,
								errorMessage: '',
								updatedAt: new Date(),
							},
							create: {
								url: url,
								content: result.data.markdown,
								status: 'success',
								type: scarapeType,
								errorMessage: '',
								updatedAt: new Date(),
							},
						});
					}
				} else {
					await this.prisma.scrapeUrls.update({
						where: { url },
						data: {
							status: 'no new content',
							errorMessage:
								'No changes detected in the url. No update needed.',
							updatedAt: new Date(),
						},
					});

					await this.prisma.scrapeHistory.upsert({
						where: {
							url: url, // assumes `url` is unique or marked with `@unique` in the schema
						},
						update: {
							content: result.data.markdown,
							status: 'no new content',
							type: scarapeType,
							errorMessage:
								'No changes detected in the url. No update needed.',
							updatedAt: new Date(),
						},
						create: {
							url: url,
							content: result.data.markdown,
							status: 'no new content',
							type: scarapeType,
							errorMessage:
								'No changes detected in the url. No update needed.',
							updatedAt: new Date(),
						},
					});
					throw new InternalServerErrorException(
						'No changes detected in the url. No update needed.',
					);
				}
			} else {
				// If no record exists, create a new entry
				const success =
					await this.weaviateService.embedAndInsertDocument({
						title: result.data.metadata?.title || '',
						content: result.data.markdown,
						source_url: url,
						excerpt: result.data.metadata?.description || '',
						date: new Date().toISOString(),
						type: 'page',
						language: 'en',
						collection: 'RtCampCom',
						chunkSize: 1000,
						chunkOverlap: 500,
					});

				if (!success) {
					await this.prisma.scrapeUrls.update({
						where: { url },
						data: {
							status: 'failed',
							errorMessage:
								'Failed to embed and insert document into Weaviate',
							updatedAt: new Date(),
						},
					});

					await this.prisma.scrapeHistory.upsert({
						where: {
							url: url, // assumes `url` is unique or marked with `@unique` in the schema
						},
						update: {
							content: result.data.markdown,
							status: 'failed',
							type: scarapeType,
							errorMessage:
								'Failed to embed and insert document into Weaviate',
							updatedAt: new Date(),
						},
						create: {
							url: url,
							content: result.data.markdown,
							status: 'failed',
							type: scarapeType,
							errorMessage:
								'Failed to embed and insert document into Weaviate',
							updatedAt: new Date(),
						},
					});

					throw new InternalServerErrorException(
						'Failed to embed and insert document into Weaviate',
					);
				}

				// Create a new entry in the scrape_runs table.
				await this.prisma.scrapeRun.create({
					data: {
						url,
						data: result.data.markdown, // Store the scraped markdown content.
						createdAt: new Date(), // Set the creation timestamp.
						updatedAt: new Date(), // Set the updated timestamp.
					},
				});

				await this.prisma.scrapeUrls.update({
					where: { url },
					data: { status: 'scraped', updatedAt: new Date() },
				});

				await this.prisma.scrapeHistory.upsert({
					where: {
						url: url, // assumes `url` is unique or marked with `@unique` in the schema
					},
					update: {
						content: result.data.markdown,
						status: 'success',
						type: scarapeType,
						errorMessage: '',
						updatedAt: new Date(),
					},
					create: {
						url: url,
						content: result.data.markdown,
						status: 'success',
						type: scarapeType,
						errorMessage: '',
						updatedAt: new Date(),
					},
				});
			}

			return {
				url,
				title: result.data.metadata?.title || '',
				markdown: result.data.markdown,
				excerpt: result.data.metadata?.description || '',
			};
		} catch (error) {
			await this.prisma.scrapeUrls.update({
				where: { url },
				data: {
					status: 'failed',
					errorMessage: error.message,
					updatedAt: new Date(),
				},
			});
			await this.prisma.scrapeHistory.upsert({
				where: {
					url: url, // assumes `url` is unique or marked with `@unique` in the schema
				},
				update: {
					content: '',
					status: 'failed',
					type: scarapeType,
					errorMessage: error.message,
					updatedAt: new Date(),
				},
				create: {
					url: url,
					content: '',
					status: 'failed',
					type: scarapeType,
					errorMessage: error.message,
					updatedAt: new Date(),
				},
			});
			if (error instanceof HttpException) {
				// Re-throw known HTTP exceptions (like duplicate URL).
				throw error;
			}

			throw new InternalServerErrorException(
				'Failed to scrape the URL. Please try again later.',
			);
		}
	}

	async scrapeMultipleUrls(urls: string[]): Promise<FirecrawlResponse[]> {
		const firecrawlUrl = process.env.FIRECRAWL_ENDPOINT;
		const batchEndpoint = `${firecrawlUrl}/v1/batch/scrape`;

		try {
			/**
			 * This is how the response looks like:
			 *
			 * {
			 *    "success": true,
			 *    "id": "7ce74a6b-3c03-4aaa-aae6-d766932eb8ef",
			 *    "url": "https://7d3a-123-201-215-180.ngrok-free.app/v1/batch/scrape/7ce74a6b-3c03-4aaa-aae6-d766932eb8ef?skip=0",
			 * }
			 */
			const { data: batchResponse } = await firstValueFrom(
				this.httpService
					.post(batchEndpoint, { urls, formats: ['markdown'] })
					.pipe(
						catchError((error: AxiosError) => {
							this.logger.error(
								`Initial batch request failed: ${error.message}`,
							);
							throw new InternalServerErrorException(
								`Failed to initiate batch scraping: ${error.response?.status} ${error.response?.statusText}`,
							);
						}),
					),
			);

			if (!batchResponse?.url) {
				throw new Error('Batch URL missing from Firecrawl response');
			}

			// Poll for results
			let markdownData = [];
			let nextUrl = batchResponse.url;

			// Set a timeout for the polling
			const startTime = Date.now();
			const TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

			while (nextUrl) {
				// Check for timeout
				if (Date.now() - startTime > TIMEOUT_MS) {
					this.logger.error('Polling timed out');
					throw new InternalServerErrorException(
						'Polling for results timed out. Please try again later.',
					);
				}

				/**
				 * This is how the response looks like:
				 *
				 * {
				 *    "status": "scraping",
				 *    "completed": 0,
				 *    "total": 2,
				 *    "expiresAt": "2025-04-01T10:28:24.000Z",
				 *    "next": "https://7d3a-123-201-215-180.ngrok-free.app/v1/batch/scrape/7ce74a6b-3c03-4aaa-aae6-d766932eb8ef?skip=0",
				 *    "data": []
				 * }
				 */
				const { data: pollResult } = await firstValueFrom(
					this.httpService.get(nextUrl).pipe(
						catchError((error: AxiosError) => {
							this.logger.error(
								`Polling request failed: ${error.message}`,
							);
							throw new InternalServerErrorException(
								`Failed while polling for results: ${error.response?.status} ${error.response?.statusText}`,
							);
						}),
					),
				);

				this.logger.log(
					`Scraping in progress... ${pollResult.completed}/${pollResult.total}`,
				);

				// Add any new data to our results
				if (pollResult.data && pollResult.data.length > 0) {
					const newData = pollResult.data.map((item: any) => ({
						url: item.sourceURL,
						title: item.metadata?.title || '',
						markdown: item.markdown || '',
						excerpt: item.metadata?.description || '',
					}));

					markdownData = markdownData.concat(newData);
				}

				// Check if the scraping is complete
				if (pollResult.status === 'completed') {
					break;
				}

				// Wait before polling again to avoid hammering the server
				await new Promise((resolve) => setTimeout(resolve, 1000));
				nextUrl = pollResult.next;
			}

			return markdownData;
		} catch (error) {
			this.logger.error(`Error scraping URLs: ${error.message}`);
			throw new InternalServerErrorException(
				'Failed to scrape the URLs. Please try again later.',
			);
		}
	}

	async streamCrawlWebsite(
		url: string,
		onProgress: (data: any) => void,
	): Promise<FirecrawlResponse[]> {
		const firecrawlUrl = process.env.FIRECRAWL_ENDPOINT;
		const { data: result } = await firstValueFrom(
			this.httpService.post(`${firecrawlUrl}/v1/map`, { url }),
		);

		if (!result?.success) {
			throw new InternalServerErrorException(
				'Failed to crawl the URL. Please try again later.',
			);
		}

		const links = result.links;
		const batchEndpoint = `${firecrawlUrl}/v1/batch/scrape`;

		const { data: batchResponse } = await firstValueFrom(
			this.httpService.post(batchEndpoint, {
				urls: links,
				formats: ['markdown'],
			}),
		);

		let nextUrl = batchResponse.url;
		let allData: FirecrawlResponse[] = [];

		while (nextUrl) {
			if (nextUrl.startsWith('https://')) {
				nextUrl = nextUrl.replace('https://', 'http://');
			}

			const { data: pollResult } = await firstValueFrom(
				this.httpService.get(nextUrl),
			);

			onProgress({
				status: 'progress',
				completed: pollResult.completed,
				total: pollResult.total,
			});

			if (pollResult.data?.length) {
				const newData = pollResult.data.map((item: any) => ({
					url: item.metadata?.url || '',
					title: item.metadata?.title || '',
					markdown: item.markdown || '',
					excerpt: item.metadata?.description || '',
				}));
				allData.push(...newData);
			}

			if (pollResult.status === 'completed') {
				break;
			}

			nextUrl = pollResult.next;
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}

		return allData;
	}

	async populateCrawlWeaviateWithProgress(
		data: {
			title: string;
			markdown: string;
			url: string;
			excerpt: string;
		}[],
		siteUrl: string,
		collection: string,
		onProgress: (progress: {
			status: string;
			completed?: number;
			total?: number;
			message?: string;
			urls?: string[];
		}) => void,
	): Promise<number> {
		let totalInserted = 0;
		const populatedUrls: string[] = [];

		for (let i = 0; i < data.length; i++) {
			const item = data[i];
			try {
				let currentErrorMessage = '';
				// Check if the URL is already in the database.
				const existingUrl = await this.prisma.crawlPageUrls.findUnique({
					where: { url: item.url },
				});
				const parsedMarkdown = await this.parseMarkdown(item.markdown);

				if (existingUrl) {
					if (existingUrl.data !== parsedMarkdown) {
						const diffLinesResult = diffLines(
							existingUrl.data,
							parsedMarkdown,
						);

						// Filter out the added lines.
						const addedContent = diffLinesResult
							.filter((part) => part.added)
							.map((part) => part.value)
							.join('')
							.split('\n')
							.filter(
								(line) =>
									!/^Last updated on/i.test(line.trim()),
							) // ignore lines like "Last updated on ..."
							.join('\n');

						if (addedContent.trim()) {
							const success =
								await this.weaviateService.embedAndInsertDocument(
									{
										title: item.title || '',
										content: addedContent.trim(),
										source_url: item.url,
										excerpt: item.excerpt || '',
										date: new Date().toISOString(),
										type: 'page',
										language: 'en',
										collection,
										chunkSize: 1000,
										chunkOverlap: 500,
									},
								);

							if (!success) {
								await this.prisma.crawlPageUrls.update({
									where: { url: item.url },
									data: {
										status: 'failed',
										updatedAt: new Date(),
										errorMessage:
											'Failed to insert document into Weaviate.',
									},
								});

								currentErrorMessage = `Failed to insert ${item.url} document into Weaviate.`;
								totalInserted++;
								onProgress({
									status: 'error',
									completed: totalInserted,
									total: data.length,
									message: currentErrorMessage,
								});
								continue;
							}

							await this.prisma.crawlPageUrls.update({
								where: { url: item.url },
								data: {
									data: parsedMarkdown,
									updatedAt: new Date(),
									status: 'success',
								},
							});

							populatedUrls.push(item.url);
						}
					} else {
						await this.prisma.crawlPageUrls.update({
							where: { url: item.url },
							data: {
								updatedAt: new Date(),
								status: 'no new content',
								errorMessage: `No new content for ${item.url}, skipping repopulating it again`,
							},
						});
						currentErrorMessage = `No new content for ${item.url}, skipping repopulating it again`;
						totalInserted++;
						onProgress({
							status: 'no new content',
							total: data.length,
							message: currentErrorMessage,
						});
						continue;
					}
				} else {
					await this.prisma.crawlPageUrls.create({
						data: {
							url: item.url,
							data: parsedMarkdown,
							siteUrl,
						},
					});

					const success =
						await this.weaviateService.embedAndInsertDocument({
							title: item.title || '',
							content: parsedMarkdown,
							source_url: item.url,
							excerpt: item.excerpt || '',
							date: new Date().toISOString(),
							type: 'page',
							language: 'en',
							collection,
							chunkSize: 1000,
							chunkOverlap: 500,
						});

					if (!success) {
						await this.prisma.crawlPageUrls.update({
							where: { url: item.url },
							data: {
								status: 'failed',
								updatedAt: new Date(),
								errorMessage:
									'Failed to insert document into Weaviate.',
							},
						});
						currentErrorMessage = `Failed to insert ${item.url} document into Weaviate.`;
						totalInserted++;
						onProgress({
							status: 'error',
							total: data.length,
							message: currentErrorMessage,
						});
						continue;
					}

					await this.prisma.crawlPageUrls.update({
						where: { url: item.url },
						data: {
							status: 'success',
							updatedAt: new Date(),
						},
					});

					populatedUrls.push(item.url);
				}

				totalInserted++;
				if (totalInserted % 5 === 0 || totalInserted === data.length) {
					onProgress({
						status: 'populating',
						total: data.length,
						urls: [...populatedUrls.slice(-5)],
					});
				}
			} catch (e) {
				await this.prisma.crawlPageUrls.update({
					where: { url: item.url },
					data: {
						status: 'error',
						updatedAt: new Date(),
						errorMessage: e.message,
					},
				});
				totalInserted++;
				onProgress({
					status: 'error',
					total: data.length,
					message: e.message,
				});
			}
		}

		return totalInserted;
	}

	async addUrl(url: string): Promise<{ url: string }> {
		try {
			const existingUrl = await this.prisma.scrapeUrls.findUnique({
				where: { url },
			});
			if (existingUrl) {
				throw new InternalServerErrorException(
					'URL already exists in the database.',
				);
			}

			const result = await this.prisma.scrapeUrls.upsert({
				where: { url },
				update: {},
				create: { url },
			});

			return {
				url: result.url,
			};
		} catch (error) {
			if (error instanceof HttpException) {
				// Re-throw known HTTP exceptions (like duplicate URL).
				throw error;
			}

			// Fallback to generic error
			throw new InternalServerErrorException(
				'Failed to add the URL. Please try again later.',
			);
		}
	}

	async getUrls(): Promise<
		{ url: string; frequency: string; status: string; id: string }[]
	> {
		try {
			const urls = await this.prisma.scrapeUrls.findMany({
				select: { url: true, id: true, status: true, frequency: true },
			});

			return urls;
		} catch (error) {
			this.logger.error(`Error fetching URLs: ${error.message}`);
			throw new InternalServerErrorException(
				'Failed to fetch the URLs. Please try again later.',
			);
		}
	}

	async addCrawlUrl(url: string): Promise<{ url: string }> {
		try {
			const existingUrl = await this.prisma.crawlUrls.findUnique({
				where: { url },
			});
			if (existingUrl) {
				throw new InternalServerErrorException(
					'URL already exists in the database.',
				);
			}

			const result = await this.prisma.crawlUrls.upsert({
				where: { url },
				update: {},
				create: { url },
			});

			return {
				url: result.url,
			};
		} catch (error) {
			if (error instanceof HttpException) {
				// Re-throw known HTTP exceptions (like duplicate URL).
				throw error;
			}

			// Fallback to generic error
			throw new InternalServerErrorException(
				'Failed to add the URL. Please try again later.',
			);
		}
	}

	async getCrawlUrls(): Promise<
		{ url: string; frequency: string; status: string; id: string }[]
	> {
		try {
			const urls = await this.prisma.crawlUrls.findMany({
				select: { url: true, id: true, status: true, frequency: true },
			});

			return urls;
		} catch (error) {
			this.logger.error(`Error fetching URLs: ${error.message}`);
			throw new InternalServerErrorException(
				'Failed to fetch the URLs. Please try again later.',
			);
		}
	}

	async getDocsUrl(): Promise<
		{ url: string; frequency: string; status: string; id: string }[]
	> {
		try {
			const urls = await this.prisma.docsUrls.findMany({
				select: { url: true, id: true, status: true, frequency: true },
			});

			return urls;
		} catch (error) {
			if (error instanceof HttpException) {
				throw error;
			}
			throw new InternalServerErrorException(
				'Failed to fetch the URLs. Please try again later.',
			);
		}
	}

	async addDocsUrl(url: string): Promise<{ url: string }> {
		try {
			const existingUrl = await this.prisma.docsUrls.findUnique({
				where: { url },
			});
			if (existingUrl) {
				throw new InternalServerErrorException(
					'URL already exists in the database.',
				);
			}

			const result = await this.prisma.docsUrls.upsert({
				where: { url },
				update: {},
				create: { url },
			});

			return {
				url: result.url,
			};
		} catch (error) {
			if (error instanceof HttpException) {
				// Re-throw known HTTP exceptions (like duplicate URL).
				throw error;
			}

			// Fallback to generic error
			throw new InternalServerErrorException(
				'Failed to add the URL. Please try again later.',
			);
		}
	}

	private async parseMarkdown(markdown: string): Promise<string> {
		try {
			// Parse the markdown content to HTML.
			const html = await marked(markdown);

			// Sanitize the HTML to remove any unwanted tags and attributes.
			const plainText = sanitizeHtml(html, {
				allowedTags: [],
				allowedAttributes: {},
			});

			const cleaned = plainText
				.replace(/\n{3,}/g, '\n\n')
				.replace(/\s{2,}/g, ' ')
				.trim();

			return cleaned;
		} catch (error) {
			throw new InternalServerErrorException(
				'Failed to parse the markdown. Please try again later.',
			);
		}
	}

	async setCrawlFrequency(url: string, frequency: string) {
		try {
			const validFrequencies = [
				'daily',
				'weekly',
				'monthly',
				'yearly',
				'never',
			];
			if (!validFrequencies.includes(frequency)) {
				throw new BadRequestException('Invalid frequency');
			}

			const existingUrl = await this.prisma.crawlUrls.findUnique({
				where: { url },
			});
			if (!existingUrl) {
				throw new InternalServerErrorException(
					'URL does not exist in the database.',
				);
			}

			await this.prisma.crawlUrls.update({
				where: { url },
				data: { frequency, updatedAt: new Date() },
			});

			return {
				url,
				frequency,
			};
		} catch (error) {
			if (error instanceof HttpException) {
				throw error;
			}
			throw new InternalServerErrorException(
				'Failed to set the frequency. Please try again later.',
			);
		}
	}

	async setFrequency(url: string, frequency: string) {
		try {
			const validFrequencies = [
				'daily',
				'weekly',
				'monthly',
				'yearly',
				'never',
			];
			if (!validFrequencies.includes(frequency)) {
				throw new BadRequestException('Invalid frequency');
			}

			const existingUrl = await this.prisma.scrapeUrls.findUnique({
				where: { url },
			});
			if (!existingUrl) {
				throw new InternalServerErrorException(
					'URL does not exist in the database.',
				);
			}

			await this.prisma.scrapeUrls.update({
				where: { url },
				data: { frequency, updatedAt: new Date() },
			});

			return {
				url,
				frequency,
			};
		} catch (error) {
			if (error instanceof HttpException) {
				throw error;
			}
			throw new InternalServerErrorException(
				'Failed to set the frequency. Please try again later.',
			);
		}
	}

	async setDocsFrequency(url: string, frequency: string) {
		try {
			const validFrequencies = [
				'daily',
				'weekly',
				'monthly',
				'yearly',
				'never',
			];
			if (!validFrequencies.includes(frequency)) {
				throw new BadRequestException('Invalid frequency');
			}

			const existingUrl = await this.prisma.docsUrls.findUnique({
				where: { url },
			});
			if (!existingUrl) {
				throw new InternalServerErrorException(
					'URL does not exist in the database.',
				);
			}

			await this.prisma.docsUrls.update({
				where: { url },
				data: { frequency, updatedAt: new Date() },
			});

			return {
				url,
				frequency,
			};
		} catch (error) {
			if (error instanceof HttpException) {
				throw error;
			}
			throw new InternalServerErrorException(
				'Failed to set the frequency. Please try again later.',
			);
		}
	}

	async setIntegratedWebsiteFrequency(url: string, frequency: string) {
		try {
			const validFrequencies = [
				'daily',
				'weekly',
				'monthly',
				'yearly',
				'never',
			];
			if (!validFrequencies.includes(frequency)) {
				throw new BadRequestException('Invalid frequency');
			}

			const existingUrl = await this.prisma.integratedWebsites.findUnique(
				{
					where: { url },
				},
			);
			if (!existingUrl) {
				throw new InternalServerErrorException(
					'URL does not exist in the database.',
				);
			}

			await this.prisma.integratedWebsites.update({
				where: { url },
				data: { frequency, updatedAt: new Date() },
			});

			return {
				url,
				frequency,
			};
		} catch (error) {
			if (error instanceof HttpException) {
				throw error;
			}
			throw new InternalServerErrorException(
				'Failed to set the frequency. Please try again later.',
			);
		}
	}

	async crawlAndPopulate(url: string, collection: string) {
		const logs: string[] = [];
		const onProgress = (data: any) => {
			if (data.status === 'progress') {
				const msg = `Progress: Scraped ${data.completed} of ${data.total}`;
				this.logger.log(msg);
				logs.push(msg);
			} else if (data.status === 'populating') {
				const msg = `Populating: Inserted ${data.urls.join(', ')}`;
				this.logger.log(msg);
				logs.push(msg);
			} else if (data.status === 'no new content') {
				this.logger.log(data.message);
				logs.push(data.message);
			} else if (data.status === 'error') {
				this.logger.error(data.message);
				logs.push(data.message);
			} else {
				this.logger.log(data);
				logs.push(data);
			}
		};

		const result = await this.streamCrawlWebsite(url, onProgress);
		await this.populateCrawlWeaviateWithProgress(
			result,
			url,
			collection,
			onProgress,
		);

		return {
			logs,
		};
	}

	private async readGoogleDocs(documentId: string, auth: any) {
		try {
			const docs = google.docs({ version: 'v1', auth });
			const response = await docs.documents.get({
				documentId,
			});

			return response.data;
		} catch (error) {
			throw new InternalServerErrorException(
				'Failed to read the Google Docs. Please try again later.' +
					error,
			);
		}
	}

	private extractGoogleDocsId = (url: string): string | null => {
		try {
			const parsedUrl = new URL(url);
			const match = parsedUrl.pathname.match(
				/\/document\/d\/([a-zA-Z0-9-_]+)/,
			);
			return match ? match[1] : null;
		} catch {
			return null;
		}
	};

	private extractPlainText(content: any[]): string {
		return content
			.map((block) => {
				if (block.paragraph?.elements) {
					return block.paragraph.elements
						.map((el) => el.textRun?.content ?? '')
						.join('');
				}

				if (block.table) {
					return block.table.tableRows
						.map((row) =>
							row.tableCells
								.map(
									(cell) =>
										this.extractPlainText(cell.content), // recursive
								)
								.join(' | '),
						)
						.join('\n');
				}

				return '';
			})
			.join('\n');
	}

	async scrapeDocs(url: string) {
		try {
			const credentials = {
				type: 'service_account',
				project_id: process.env.GOOGLE_DOCS_PROJECT_ID,
				private_key_id: process.env.GOOGLE_DOCS_PRIVATE_KEY_ID,
				private_key: process.env.GOOGLE_DOCS_PRIVATE_KEY,
				client_email: process.env.GOOGLE_DOCS_CLIENT_MAIL,
				client_id: process.env.GOOGLE_DOCS_CLIENT_ID,
				auth_uri: 'https://accounts.google.com/o/oauth2/auth',
				token_uri: 'https://oauth2.googleapis.com/token',
				auth_provider_x509_cert_url:
					'https://www.googleapis.com/oauth2/v1/certs',
				client_x509_cert_url:
					process.env.GOOGLE_DOCS_CLIENT_X509_CERT_URL,
				universe_domain: 'googleapis.com',
			};
			const auth = new google.auth.GoogleAuth({
				credentials,
				scopes: ['https://www.googleapis.com/auth/documents'],
			});
			const existingUrl = await this.prisma.docsUrls.findUnique({
				where: { url },
			});

			if (!existingUrl) {
				throw new InternalServerErrorException(
					'URL does not exist in the database.',
				);
			}

			const documentId = this.extractGoogleDocsId(url);
			if (!documentId) {
				throw new BadRequestException('Invalid Google Docs URL');
			}

			const data = await this.readGoogleDocs(documentId, auth);

			const text = this.extractPlainText(data.body.content);

			if (existingUrl.data && existingUrl.data.length > 0) {
				if (existingUrl.data !== text) {
					const diffLinesResult = diffLines(existingUrl.data, text);

					// Filter out the added lines.
					const addedContent = diffLinesResult
						.filter((part) => part.added)
						.map((part) => part.value)
						.join('')
						.split('\n')
						.filter(
							(line) => !/^Last updated on/i.test(line.trim()),
						) // ignore lines like "Last updated on ..."
						.join('\n');

					if (addedContent.trim().length > 0) {
						const success =
							await this.weaviateService.embedAndInsertDocument({
								title: data.title || '',
								content: text,
								source_url: addedContent,
								excerpt: data.title || '',
								date: new Date().toISOString(),
								type: 'internal_doc',
								language: 'en',
								collection: 'RtCampCom',
								chunkSize: 1000,
								chunkOverlap: 500,
							});
						if (!success) {
							await this.prisma.docsUrls.update({
								where: { url },
								data: {
									status: 'failed',
									updatedAt: new Date(),
									errorMessage:
										"Failed to populate the docs content to WPAI_Chatbot's knowledge base. Please try again later.",
								},
							});
							await this.prisma.scrapeHistory.upsert({
								where: {
									url: url, // assumes `url` is unique or marked with `@unique` in the schema
								},
								update: {
									content: text,
									status: 'failed',
									type: 'single docs url',
									errorMessage:
										"Failed to populate the docs content to WPAI_Chatbot's knowledge base. Please try again later.",
									updatedAt: new Date(),
								},
								create: {
									url: url,
									content: text,
									status: 'no new content',
									type: 'single docs url',
									errorMessage:
										"Failed to populate the docs content to WPAI_Chatbot's knowledge base. Please try again later.",
									updatedAt: new Date(),
								},
							});
							throw new InternalServerErrorException(
								"Failed to populate the docs content to WPAI_Chatbot's knowledge base. Please try again later.",
							);
						}

						await this.prisma.docsUrls.update({
							where: { url },
							data: {
								data: text,
								status: 'scraped',
								updatedAt: new Date(),
							},
						});

						await this.prisma.scrapeHistory.upsert({
							where: {
								url: url, // assumes `url` is unique or marked with `@unique` in the schema
							},
							update: {
								content: text,
								status: 'success',
								type: 'single docs url',
								errorMessage: '',
								updatedAt: new Date(),
							},
							create: {
								url: url,
								content: text,
								status: 'success',
								type: 'single docs url',
								errorMessage: '',
								updatedAt: new Date(),
							},
						});

						return {
							status: 'success',
							message:
								"Successfully populated the docs content to WPAI_Chatbot's knowledge base.",
						};
					}
				} else {
					const errorMessage = `No new content found in doc ${data.title} to populate. No update needed.`;
					await this.prisma.docsUrls.update({
						where: { url },
						data: {
							status: 'no new content',
							errorMessage,
							updatedAt: new Date(),
						},
					});
					await this.prisma.scrapeHistory.upsert({
						where: {
							url: url, // assumes `url` is unique or marked with `@unique` in the schema
						},
						update: {
							content: text,
							status: 'no new content',
							type: 'single docs url',
							errorMessage: errorMessage,
							updatedAt: new Date(),
						},
						create: {
							url: url,
							content: text,
							status: 'no new content',
							type: 'single docs url',
							errorMessage: errorMessage,
							updatedAt: new Date(),
						},
					});
					throw new InternalServerErrorException(
						'No changes detected in the url. No update needed.',
					);
				}
			}

			const success = await this.weaviateService.embedAndInsertDocument({
				title: data.title || '',
				content: text,
				source_url: url,
				excerpt: data.title || '',
				date: new Date().toISOString(),
				type: 'internal_doc',
				language: 'en',
				collection: 'RtCampCom',
				chunkSize: 1000,
				chunkOverlap: 500,
			});
			if (!success) {
				await this.prisma.docsUrls.update({
					where: { url },
					data: {
						status: 'failed',
						updatedAt: new Date(),
						errorMessage:
							"Failed to populate the docs content to WPAI_Chatbot's knowledge base. Please try again later.",
					},
				});
				await this.prisma.scrapeHistory.upsert({
					where: {
						url: url, // assumes `url` is unique or marked with `@unique` in the schema
					},
					update: {
						content: text,
						status: 'failed',
						type: 'single docs url',
						errorMessage:
							"Failed to populate the docs content to WPAI_Chatbot's knowledge base. Please try again later.",
						updatedAt: new Date(),
					},
					create: {
						url: url,
						content: text,
						status: 'failed',
						type: 'single docs url',
						errorMessage:
							"Failed to populate the docs content to WPAI_Chatbot's knowledge base. Please try again later.",
						updatedAt: new Date(),
					},
				});
				throw new InternalServerErrorException(
					"Failed to populate the docs content to WPAI_Chatbot's knowledge base. Please try again later.",
				);
			}

			await this.prisma.docsUrls.update({
				where: { url },
				data: { data: text, status: 'scraped', updatedAt: new Date() },
			});

			await this.prisma.scrapeHistory.upsert({
				where: {
					url: url, // assumes `url` is unique or marked with `@unique` in the schema
				},
				update: {
					content: text,
					status: 'success',
					type: 'single docs url',
					errorMessage: '',
					updatedAt: new Date(),
				},
				create: {
					url: url,
					content: text,
					status: 'success',
					type: 'single docs url',
					errorMessage: '',
					updatedAt: new Date(),
				},
			});

			return {
				status: 'success',
				message:
					"Successfully populated the docs content to WPAI_Chatbot's knowledge base.",
			};
		} catch (error) {
			await this.prisma.docsUrls.update({
				where: { url },
				data: {
					status: 'failed',
					errorMessage:
						'Failed to scrape the Google Docs. Please try again later.',
					updatedAt: new Date(),
				},
			});
			await this.prisma.scrapeHistory.upsert({
				where: {
					url: url, // assumes `url` is unique or marked with `@unique` in the schema
				},
				update: {
					content: '',
					status: 'failed',
					type: 'single docs url',
					errorMessage:
						'Failed to scrape the Google Docs. Please try again later.',
					updatedAt: new Date(),
				},
				create: {
					url: url,
					content: '',
					status: 'failed',
					type: 'single docs url',
					errorMessage:
						'Failed to scrape the Google Docs. Please try again later.',
					updatedAt: new Date(),
				},
			});
			if (error instanceof HttpException) {
				throw error;
			}
			throw new InternalServerErrorException(
				'Failed to scrape the Google Docs. Please try again later.',
			);
		}
	}

	async checkDocsPermission(url: string, userEmail: string) {
		const credentials = {
			type: 'service_account',
			project_id: process.env.GOOGLE_DOCS_PROJECT_ID,
			private_key_id: process.env.GOOGLE_DOCS_PRIVATE_KEY_ID,
			private_key: process.env.GOOGLE_DOCS_PRIVATE_KEY,
			client_email: process.env.GOOGLE_DOCS_CLIENT_MAIL,
			client_id: process.env.GOOGLE_DOCS_CLIENT_ID,
			auth_uri: 'https://accounts.google.com/o/oauth2/auth',
			token_uri: 'https://oauth2.googleapis.com/token',
			auth_provider_x509_cert_url:
				'https://www.googleapis.com/oauth2/v1/certs',
			client_x509_cert_url: process.env.GOOGLE_DOCS_CLIENT_X509_CERT_URL,
			universe_domain: 'googleapis.com',
		};
		const auth = new google.auth.GoogleAuth({
			credentials,
			scopes: ['https://www.googleapis.com/auth/drive.metadata.readonly'],
		});

		try {
			const drive = google.drive({ version: 'v3', auth });

			const fileId = this.extractGoogleDocsId(url);

			const res = await drive.permissions.list({
				fileId,
				fields: 'permissions(emailAddress,role,type)',
			});

			const permissions = res.data.permissions || [];

			const userPermission = permissions.find(
				(perm) =>
					perm.type === 'user' &&
					perm.emailAddress?.toLowerCase() ===
						userEmail.toLowerCase(),
			);

			if (
				userPermission &&
				(userPermission.role === 'writer' ||
					userPermission.role === 'owner')
			) {
				return true;
			}

			return false;
		} catch (error) {
			if (error instanceof HttpException) {
				throw error;
			}
			throw new InternalServerErrorException(
				'Failed to check the Google Docs permission. Please try again later. ' +
					error.message,
			);
		}
	}

	private async createAndSendToken(url: string) {
		const pingUrl = `${url.replace(/\/$/, '')}/wp-json/wpai-chatbot/v1/ping`;
		try {
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), 5000);

			const res = await fetch(pingUrl, {
				signal: controller.signal,
			});

			clearTimeout(timeout);

			if (!res.ok) {
				throw new Error(`Ping failed with status ${res.status}`);
			}

			const data = await res.json();
			if (data.status && data.status !== 'active') {
				throw new Error(`Plugin is not active in website ${url}.`);
			}

			const token = randomBytes(32).toString('hex');

			const tokenSaveResponse = await fetch(
				`${url.replace(/\/$/, '')}/wp-json/wpai-chatbot/v1/token`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'x-api-key': process.env.API_KEY,
					},
					body: JSON.stringify({ token }),
				},
			);

			if (!tokenSaveResponse.ok) {
				throw new Error(
					`Failed to save token in website ${url}. Status: ${tokenSaveResponse.status}`,
				);
			}

			const tokenSaveData = await tokenSaveResponse.json();

			if (tokenSaveData.status !== 'success') {
				throw new Error(`Failed to save token in website ${url}.`);
			}

			return token;
		} catch (error) {
			if (error.name === 'AbortError') {
				throw new Error(`Timeout while pinging website ${url}.`);
			} else {
				throw new Error(
					`Failed to ping website ${url}. Error: ${error}`,
				);
			}
		}
	}

	private toPascalCase(input: string): string {
		return input
			.replace(/[-_./]+/g, ' ') // replace dash/dot/underscore with space.
			.replace(/\s(.)/g, (_, group1) => group1.toUpperCase()) // capitalize first letter of each word.
			.replace(/^(.)/, (_, group1) => group1.toUpperCase()) // capitalize first letter.
			.replace(/\s+/g, ''); // remove spaces.
	}

	async addIntegratedWebsite(url: string) {
		try {
			const existingUrl = await this.prisma.integratedWebsites.findUnique(
				{
					where: { url },
				},
			);
			if (existingUrl) {
				throw new InternalServerErrorException(
					'URL already exists in the database.',
				);
			}

			const token = await this.createAndSendToken(url);

			const result = await this.prisma.integratedWebsites.upsert({
				where: { url },
				update: {},
				create: { url, token, updatedAt: new Date() },
			});

			const { hostname, pathname } = new URL(url);
			const cleanPath = pathname.replace(/^\/|\/$/g, '');
			const domain = cleanPath ? `${hostname}/${cleanPath}` : hostname;
			const safeDomain = this.toPascalCase(domain);
			let collection = `TrdParty${safeDomain}`;

			if (domain === process.env.WPAI_CHATBOT_MAIN_SITE_DOMAIN) {
				collection = 'RtCampCom';
			}

			await this.prisma.integratedWebsites.update({
				where: { url },
				data: { collection },
			});

			return {
				url: result.url,
			};
		} catch (error) {
			if (error instanceof HttpException) {
				// Re-throw known HTTP exceptions (like duplicate URL).
				throw error;
			}

			// Fallback to generic error
			throw new InternalServerErrorException(
				'Failed to add the URL. Please try again later.' + error,
			);
		}
	}

	async getIntegratedWebsites(): Promise<
		{ url: string; frequency: string; status: string; id: string }[]
	> {
		try {
			const urls = await this.prisma.integratedWebsites.findMany({
				select: { url: true, id: true, status: true, frequency: true },
			});

			return urls;
		} catch (error) {
			if (error instanceof HttpException) {
				throw error;
			}
			throw new InternalServerErrorException(
				'Failed to fetch the URLs. Please try again later.',
			);
		}
	}

	async deleteIntegratedWebsite(url: string) {
		try {
			const existingUrl = await this.prisma.integratedWebsites.findUnique(
				{
					where: { url },
				},
			);
			if (!existingUrl) {
				throw new InternalServerErrorException(
					'URL does not exist in the database.',
				);
			}
			const collection = existingUrl.collection;
			if (!collection) {
				throw new InternalServerErrorException(
					'Failed to delete the website. Please try again later.',
				);
			}
			const success =
				await this.weaviateService.deleteDocument(collection);
			if (!success) {
				throw new InternalServerErrorException(
					'Failed to delete the website. Please try again later.',
				);
			}

			await this.prisma.crawlPageUrls.deleteMany({
				where: {
					siteUrl: url,
				},
			});

			await this.prisma.integratedWebsites.delete({
				where: { url },
			});
			return { url };
		} catch (error) {
			if (error instanceof HttpException) {
				throw error;
			}
			throw new InternalServerErrorException(
				'Failed to delete the website. Please try again later.',
			);
		}
	}
}
