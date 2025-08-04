import {
	Injectable,
	ConflictException,
	NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@wpai-chatbot/prisma.service';

import { CreateSystemPromptDto } from '../../dto/system-prompt/create-system-prompt.dto';
import { UpdateSystemPromptDto } from '../../dto/system-prompt/update-system-prompt.dto';

@Injectable()
export class SystemPromptsService {
	constructor(private prisma: PrismaService) {}

	async create(createSystemPromptDto: CreateSystemPromptDto) {
		const { prompt, clientId, type } = createSystemPromptDto;
		try {
			return await this.prisma.systemPrompt.create({
				data: {
					prompt,
					clientId,
					type: type || 'system',
				},
			});
		} catch (error) {
			if (error.code === 'P2002') {
				throw new ConflictException(
					`A system prompt already exists for client "${clientId}" with type "${type || 'system'}"`,
				);
			}
			throw error;
		}
	}

	async findAllByClient(clientId: string) {
		return await this.prisma.systemPrompt.findMany({
			where: {
				clientId,
			},
			orderBy: {
				createdAt: 'desc',
			},
		});
	}

	async findAll() {
		return await this.prisma.systemPrompt.findMany({
			orderBy: {
				createdAt: 'desc',
			},
		});
	}

	async update(id: string, updateSystemPromptDto: UpdateSystemPromptDto) {
		try {
			const existingPrompt = await this.prisma.systemPrompt.findUnique({
				where: { id },
			});

			if (!existingPrompt) {
				throw new NotFoundException(
					`System prompt with ID "${id}" not found`,
				);
			}

			return await this.prisma.systemPrompt.update({
				where: { id },
				data: updateSystemPromptDto,
			});
		} catch (error) {
			if (error.code === 'P2002') {
				throw new ConflictException(
					`A system prompt with this client and type combination already exists`,
				);
			}
			throw error;
		}
	}

	async remove(id: string) {
		try {
			const existingPrompt = await this.prisma.systemPrompt.findUnique({
				where: { id },
			});

			if (!existingPrompt) {
				throw new NotFoundException(
					`System prompt with ID "${id}" not found`,
				);
			}

			return await this.prisma.systemPrompt.delete({
				where: { id },
			});
		} catch (error) {
			if (error instanceof NotFoundException) {
				throw error;
			}
			throw new Error('Failed to delete system prompt');
		}
	}
}
