import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../prisma.service';

@Injectable()
export class SharedChatService {
	constructor(private prisma: PrismaService) {}

	async createSharedChat(sessionId: string) {
		// First, check if the session exists
		const session = await this.prisma.session.findUnique({
			where: { id: sessionId },
			include: {
				messages: {
					orderBy: {
						createdAt: 'asc',
					},
				},
			},
		});

		if (!session) {
			throw new NotFoundException(
				`Session with ID ${sessionId} not found`,
			);
		}

		// Create a SharedChat instance with messages stored as JSON
		const sharedChat = await this.prisma.sharedChat.create({
			data: {
				sessionId: session.id,
				messagesJSON: JSON.stringify(session.messages),
			},
		});

		return sharedChat;
	}
}
