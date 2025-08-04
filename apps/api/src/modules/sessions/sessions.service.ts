import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@wpai-chatbot/prisma.service';
import { CreateSessionDto } from '@wpai-chatbot/dto/session/create-session.dto';
import { FilterSessionDto } from '@wpai-chatbot/dto/session/filter-session.dto';
import { UpdateUserDto } from '@wpai-chatbot/dto/session/update-user.dto';
import { CreateSessionFromSharedChatDto } from '@wpai-chatbot/dto/session/create-session-from-shared-chat.dto';

@Injectable()
export class SessionsService {
	constructor(private prisma: PrismaService) {}

	async findAll(filters: FilterSessionDto) {
		const {
			page = 1,
			clientId,
			startDate,
			endDate,
			userId,
			limit = 10,
			userEmail,
			includeEmpty = false,
		} = filters;

		let where: any = {};

		if (clientId) where.clientId = clientId;
		if (startDate)
			where.createdAt = { ...(where.createdAt || {}), gte: startDate };
		if (endDate)
			where.createdAt = { ...(where.createdAt || {}), lte: endDate };
		if (userId) where.userId = userId;

		if (userEmail) {
			where = {
				...where,
				user: {
					email: userEmail,
				},
			};
		}

		if (includeEmpty === false) {
			where = {
				...where,
				messages: {
					some: {},
				},
			};
		}

		const [sessions, total] = await Promise.all([
			this.prisma.session.findMany({
				skip: (page - 1) * limit,
				take: parseInt(limit.toString(), 10),
				where,
				orderBy: {
					updatedAt: 'desc',
				},
				include: {
					messages: {
						orderBy: {
							createdAt: 'asc',
						},
						take: 1,
					},
					user: true,
					_count: {
						select: { messages: true },
					},
				},
			}),
			this.prisma.session.count({ where }),
		]);

		const mappedSessions = sessions.map((session) => ({
			...session,
			messageCount: session._count.messages,
		}));

		return {
			data: mappedSessions,
			meta: {
				total,
				page,
				limit,
				pages: Math.ceil(total / limit),
			},
		};
	}

	async findByEmail(email: string, page = 1, limit = 10) {
		if (!email) {
			throw new BadRequestException('Email is required');
		}

		const where = {
			user: {
				email: email,
			},
		};

		const [sessions, total] = await Promise.all([
			this.prisma.session.findMany({
				skip: (page - 1) * limit,
				take: parseInt(limit.toString(), 10),
				where,
				orderBy: {
					updatedAt: 'desc',
				},
				include: { messages: true, user: true },
			}),
			this.prisma.session.count({ where }),
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

	async findAllByUserId(userId: string) {
		const user = await this.prisma.user.findUnique({
			where: {
				logtoUserId: userId,
			},
		});

		if (!user) {
			return {
				data: [],
				meta: {
					total: 0,
				},
			};
		}

		const where = {
			userId: user.id,
		};

		const [sessions, total] = await Promise.all([
			this.prisma.session.findMany({
				where,
				orderBy: {
					updatedAt: 'desc',
				},
				include: { messages: true, user: true },
			}),
			this.prisma.session.count({ where }),
		]);

		return {
			data: sessions,
			meta: {
				total,
			},
		};
	}

	async findOne(id: string) {
		const session = await this.prisma.session.findUnique({
			where: { id },
			include: {
				messages: {
					orderBy: {
						createdAt: 'asc',
					},
				},
			},
		});

		if (!session) throw new NotFoundException();
		return session;
	}

	async create(data: CreateSessionDto) {
		const user = await this.prisma.user.upsert({
			where: {
				logtoUserId: data.userId,
			},
			update: {},
			create: {
				name: data.name,
				logtoUserId: data.userId,
				email: data.email,
			},
		});

		return this.prisma.session.create({
			data: {
				clientId: data.clientId,
				userId: user.id,
				userTimeZone: data.userTimeZone,
			},
			include: { messages: true, user: true },
		});
	}

	async delete(id: string) {
		await this.prisma.$transaction([
			this.prisma.message.deleteMany({
				where: { sessionId: id },
			}),
			this.prisma.session.delete({
				where: { id },
			}),
		]);
	}

	async updateUserById(id: string, updateUserData: UpdateUserDto) {
		const user = await this.prisma.user.findUnique({
			where: {
				logtoUserId: id,
			},
		});

		if (!user) {
			throw new NotFoundException('User not found');
		}

		return this.prisma.user.update({
			where: {
				logtoUserId: id,
			},
			data: {
				name: updateUserData.name ? updateUserData.name : user.name,
				email: updateUserData.email,
				track_uid: updateUserData.track_uid || '',
			},
		});
	}

	async createFromSharedChat(
		createFromSharedDto: CreateSessionFromSharedChatDto,
	) {
		const { sharedChatId, userId, name, email } = createFromSharedDto;

		if (!sharedChatId || !userId) {
			throw new BadRequestException(
				'Both sharedChatId and userId are required to create a session from a shared chat',
			);
		}
		// Find the SharedChat and verify it exists, including the original session
		const sharedChat = await this.prisma.sharedChat.findUnique({
			where: { id: sharedChatId },
			include: { session: true },
		});

		if (!sharedChat) {
			throw new NotFoundException(
				`SharedChat with ID ${sharedChatId} not found`,
			);
		}
		// Parse the stored messages
		const messages = JSON.parse(sharedChat.messagesJSON);

		// Use the clientId from the original session
		const clientId = sharedChat.session.clientId;

		// Verify if user exists
		let user = await this.prisma.user.findUnique({
			where: { logtoUserId: userId },
		});

		if (!user) {
			user = await this.prisma.user.upsert({
				where: {
					logtoUserId: userId,
				},
				update: {},
				create: {
					name: name || 'no-name',
					logtoUserId: userId,
					email: email || `${userId}@guest.local`,
				},
			});
		}

		const existingSession = await this.prisma.session.findFirst({
			where: {
				originatingSharedChatId: sharedChat.id,
				userId: user.id,
			},
		});

		if (existingSession) {
			return this.prisma.session.findUnique({
				where: { id: existingSession.id },
				include: { messages: true },
			});
		}

		// Create new session with link to original SharedChat
		const session = await this.prisma.session.create({
			data: {
				clientId,
				userId: user.id,
				originatingSharedChatId: sharedChat.id,
				openAiThreadId: '',
			},
		});

		let counter = 1;
		await Promise.all(
			messages.map((msg: any) =>
				this.prisma.message.create({
					data: {
						sessionId: session.id,
						type: msg.type,
						query: msg.query,
						retrieval_result: msg.retrieval_result,
						summary: msg.summary,
						response: msg.response,
						status: 'completed', // Since these are copied messages
						searchParams: msg.searchParams,
						pageUrl: msg.pageUrl,
						createdAt: new Date(Date.now() + counter++),
					},
				}),
			),
		);

		// Return the created session with its messages
		const newSession = await this.prisma.session.findUnique({
			where: { id: session.id },
			include: {
				messages: {
					orderBy: {
						createdAt: 'asc',
					},
				},
			},
		});

		return newSession;
	}
}
