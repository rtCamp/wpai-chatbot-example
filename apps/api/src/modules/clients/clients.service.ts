import { PrismaService } from '@wpai-chatbot/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ClientsService {
	constructor(private prisma: PrismaService) {}

	async findAll() {
		const clients = await this.prisma.session.findMany({
			select: {
				clientId: true,
			},
			distinct: ['clientId'],
			orderBy: {
				clientId: 'asc',
			},
		});

		return clients
			.map((session) => session.clientId || '')
			.filter((clientId) => clientId !== '');
	}

	async getLatestMessages(clientId: string) {
		const sessions = await this.prisma.session.findMany({
			where: { clientId },
			orderBy: { createdAt: 'desc' },
			include: {
				messages: {
					orderBy: { createdAt: 'desc' },
					take: 1,
					select: {
						id: true,
						response: true,
						query: true,
						createdAt: true,
					},
				},
			},
		});

		// Transform messages array into a single object
		const result = sessions.map((session) => ({
			sessionId: session.id,
			message: session.messages[0] || null,
		}));

		return result;
	}
}
