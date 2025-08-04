import { CreateMessageDto } from '@wpai-chatbot/dto/message/create-message.dto';
import { FilterMessageDto } from '@wpai-chatbot/dto/message/filter-message.dto';
import { UpdateMessageDto } from '@wpai-chatbot/dto/message/update-message.dto';
import { SearchMessageDto } from '@wpai-chatbot/dto/message/search-message.dto';
import { PrismaService } from '@wpai-chatbot/prisma.service';
import { verifyCaptcha } from '@wpai-chatbot/utils/captcha';
import { InjectQueue } from '@nestjs/bullmq';
import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
} from '@nestjs/common';
import { Queue } from 'bullmq';
import { WeaviateService } from '@wpai-chatbot/rag';

@Injectable()
export class MessagesService {
	constructor(
		@InjectQueue('message') private messageQueue: Queue,
		private prisma: PrismaService,
		private readonly weaviateService: WeaviateService,
	) {}

	async findAll(filters: FilterMessageDto) {
		const { page = 1, sessionId, status, limit = 10 } = filters;
		const where = {
			...(sessionId && { sessionId }),
			...(status && { status }),
		};

		const [sessions, total] = await Promise.all([
			this.prisma.message.findMany({
				skip: (page - 1) * limit,
				take: parseInt(limit.toString(), 10),
				where,
				include: { session: true },
				orderBy: {
					createdAt: 'desc',
				},
			}),
			this.prisma.message.count({ where }),
		]);

		return {
			data: sessions,
			meta: {
				total,
				page,
				limit,
				pages: Math.ceil(total / limit),
			},
		};
	}

	findOne(id: string) {
		return this.prisma.message.findUnique({
			where: { id },
			select: {
				retrieval_result: false,
				summary: false,
				id: true,
				sessionId: true,
				createdAt: true,
				status: true,
				query: true,
				type: true,
				response: true,
			},
		});
	}

	async findAllBySession(
		sessionId: string,
		filters: {
			page?: number;
			limit?: number;
			status?: string;
			sort?: string;
		} = {},
	) {
		const { page = 1, limit = 10, status, sort = 'desc' } = filters;

		const where = {
			sessionId,
			...(status && { status }),
		};

		const session = await this.prisma.session.findUnique({
			where: { id: sessionId },
			include: { user: true },
		});

		const [messages, total] = await Promise.all([
			this.prisma.message.findMany({
				skip: (page - 1) * limit,
				take: parseInt(limit.toString(), 10),
				where,
				select: {
					retrieval_result: true,
					summary: true,
					id: true,
					sessionId: true,
					createdAt: true,
					status: true,
					query: true,
					type: true,
					response: true,
					pageUrl: true,
					session: {
						select: {
							clientId: true,
							createdAt: true,
							updatedAt: true,
						},
					},
				},
				orderBy: {
					createdAt: sort === 'asc' ? 'asc' : 'desc',
				},
			}),
			this.prisma.message.count({ where }),
		]);

		return {
			data: messages,
			user: session?.user || null,
			session: {
				id: sessionId,
				clientId: session?.clientId,
				createdAt: session?.createdAt,
				updatedAt: session?.updatedAt,
			},
			meta: {
				total,
				page,
				limit,
				pages: Math.ceil(total / limit),
			},
		};
	}

	async create(data: CreateMessageDto) {
		// TODO: Only check captcha if the request is coming from a browser

		if (!data.captchaToken) {
			throw new BadRequestException('Captcha token is required');
		}

		const captchaVerified = await verifyCaptcha(data.captchaToken);

		if (!captchaVerified) {
			throw new BadRequestException('Captcha verification failed');
		}

		const session = await this.prisma.session.findUnique({
			where: { id: data.sessionId },
		});

		if (!session) {
			throw new NotFoundException(`Session not found`);
		}

		const message = await this.prisma.message.create({
			data: {
				sessionId: data.sessionId,
				query: data.query,
				response: data.response || '',
				status: data.status || 'pending',
				pageUrl: data.pageUrl || '',
			},
		});

		// Add to message queue
		await this.messageQueue.add('rag', message);

		return message;
	}

	update(id: string, data: UpdateMessageDto) {
		return this.prisma.message.update({
			where: { id },
			data,
		});
	}

	delete(id: string) {
		return this.prisma.message.delete({
			where: { id },
		});
	}

	private getExcerpt(item: { excerpt?: string; content: string }) {
		if (item.excerpt && item.excerpt.trim()) {
			return item.excerpt.trim();
		}

		// Fallback: generate from content.
		const cleanedContent = item.content
			.replace(/^\.\s*/, '')
			.replace(/\[.*?\]/g, '')
			.replace(/\s+/g, ' ')
			.trim();

		return (
			cleanedContent.slice(0, 100) +
			(cleanedContent.length > 100 ? '...' : '')
		);
	}

	async search(searchMessageDto: SearchMessageDto) {
		try {
			const message = await this.prisma.message.findUnique({
				where: { id: searchMessageDto.messageId },
			});

			if (!message) {
				throw new NotFoundException(`Message not found`);
			}

			let enableWPAI_ChatbotSearchResult = true;
			const enableSearchResult = await fetch(
				`${process.env.WPAI_CHATBOT_PLUGIN_SITE}/wp-json/wpai-chatbot/v1/get_enable_search_result`,
			);
			if (enableSearchResult.ok) {
				const enableSearchResultData = await enableSearchResult.json();
				enableWPAI_ChatbotSearchResult =
					enableSearchResultData.enable_wpai_chatbot_search_result ??
					false;
			}

			if (
				!['retrieval_date_decay', 'retrieval'].includes(message.type) ||
				!enableWPAI_ChatbotSearchResult
			) {
				return { relatedDocContent: '' };
			}

			const keywordWeightRaw = await fetch(
				`${process.env.WPAI_CHATBOT_PLUGIN_SITE}/wp-json/wpai-chatbot/v1/keyword_query_weightage`,
				{
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						'x-api-key': process.env.API_KEY,
					},
				},
			);

			if (!keywordWeightRaw.ok) {
				throw new InternalServerErrorException(
					'Failed to fetch keyword weight',
				);
			}
			const keywordWeightData = await keywordWeightRaw.json();

			const retrievalResult = JSON.parse(message.retrieval_result);
			const semanticQuery =
				retrievalResult.searchMetadata?.usedSemanticQuery ?? '';
			const keywordQuery =
				retrievalResult.searchMetadata?.usedKeywordQuery ?? '';
			const keywordWeight = parseFloat(
				keywordWeightData.wpai_chatbot_keyword_query_weightage ?? '0.4',
			);

			const docs = await this.weaviateService.searchWithRRF(
				{
					rewrittenQuery: null,
					expandedQuery: semanticQuery,
					keywords: [],
					hybridSearchParams: {
						semanticQuery: semanticQuery,
						keywordQuery: keywordQuery || semanticQuery,
						suggestedWeights: {
							semantic: keywordWeight,
							keyword: 1.0 - keywordWeight,
						},
					},
				},
				10,
			);

			const relatedDocs = docs.results;
			const relatedPages = relatedDocs.filter(
				(doc) => doc.type !== 'internal_doc',
			);
			const uniquePagesMap = new Map();
			relatedPages.forEach((doc) => {
				const key = `${doc.title}-${doc.source_url}`;
				if (!uniquePagesMap.has(key)) {
					uniquePagesMap.set(key, doc);
				}
			});

			let uniquePages = Array.from(uniquePagesMap.values());

			let relatedDocContent = '';

			if (
				enableWPAI_ChatbotSearchResult &&
				uniquePages.length > 0 &&
				['retrieval_date_decay', 'retrieval'].includes(message.type)
			) {
				uniquePages =
					uniquePages.length > 5
						? uniquePages.slice(0, 5)
						: uniquePages;
				relatedDocContent = `
<div class="related-docs-accordion"><button class="accordion-toggle" onclick="this.classList.toggle('open'); const content = this.nextElementSibling; if (this.classList.contains('open')) { content.style.display = 'block'; setTimeout(() => { content.style.maxHeight = '1000px'; content.style.opacity = '1'; }, 10); } else { content.style.maxHeight = '0'; content.style.opacity = '0'; setTimeout(() => { content.style.display = 'none'; }, 400); }"><h3 class="related-docs-title"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-external-link-icon lucide-external-link"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>Related Pages</h3></button><div class="accordion-content" style="display: none;"><button class="related-docs-close-btn"><svg onclick="const btn = this.closest('.accordion-content'); const toggle = btn.previousElementSibling; toggle.classList.remove('open'); btn.style.maxHeight = '0'; btn.style.opacity = '0'; setTimeout(() => { btn.style.display = 'none'; }, 400);" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-x-icon lucide-circle-x"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg></button><ul class="related-docs-list">${uniquePages
					.map(
						(result: any) => `<li class="related-docs-item">

<a href="${result.source_url}?utm_source=wpai-chatbot&utm_medium=referral" target="_blank" rel="noopener noreferrer">${result.title}</a> -
<br><span>${this.getExcerpt({ excerpt: result.excerpt, content: result.content })}</span></li>`,
					)
					.join('')}</ul></div></div>`;

				const summaryWithRelatedDocs =
					message.summary + relatedDocContent;
				const response = JSON.parse(message.response);
				const responseWithRelatedDocs = {
					...response,
					answer: summaryWithRelatedDocs,
				};

				await this.prisma.message.update({
					where: { id: searchMessageDto.messageId },
					data: {
						summary: summaryWithRelatedDocs,
						response: JSON.stringify(responseWithRelatedDocs),
					},
				});
			}

			return { relatedDocContent };
		} catch (error) {
			console.error('Error in search:', error);

			throw new InternalServerErrorException(error);
		}
	}
}
