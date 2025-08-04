import {
	Injectable,
	ConflictException,
	NotFoundException,
	InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '@wpai-chatbot/prisma.service';
import { CreatePromptPlaceholderDto } from '@wpai-chatbot/dto/prompt-placeholders/create-prompt-placeholder.dto';
import { UpdatePromptPlaceholderDto } from '@wpai-chatbot/dto/prompt-placeholders/update-prompt-placeholder.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PromptPlaceholdersService {
	constructor(private prisma: PrismaService) {}

	async create(createPromptPlaceholderDto: CreatePromptPlaceholderDto) {
		try {
			return await this.prisma.promptPlaceholder.create({
				data: createPromptPlaceholderDto,
			});
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === 'P2002') {
					throw new ConflictException(
						'A placeholder with this client ID, key and type already exists',
					);
				}
			}
			throw new InternalServerErrorException(
				'An error occurred while creating the placeholder',
			);
		}
	}

	findAll() {
		return this.prisma.promptPlaceholder.findMany();
	}

	findOne(id: string) {
		const placeholder = this.prisma.promptPlaceholder.findUnique({
			where: { id },
		});
		if (!placeholder) {
			throw new NotFoundException('Prompt placeholder not found');
		}
		return placeholder;
	}

	findByClientId(clientId: string) {
		return this.prisma.promptPlaceholder.findMany({
			where: { clientId },
		});
	}

	async update(
		id: string,
		updatePromptPlaceholderDto: UpdatePromptPlaceholderDto,
	) {
		try {
			return await this.prisma.promptPlaceholder.update({
				where: { id },
				data: updatePromptPlaceholderDto,
			});
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === 'P2002') {
					throw new ConflictException(
						'A placeholder with this client ID, key and type already exists',
					);
				}
				if (error.code === 'P2025') {
					throw new NotFoundException('Prompt placeholder not found');
				}
			}
			throw new InternalServerErrorException(
				'An error occurred while updating the placeholder',
			);
		}
	}

	async remove(id: string) {
		try {
			return await this.prisma.promptPlaceholder.delete({
				where: { id },
			});
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === 'P2025') {
					throw new NotFoundException('Prompt placeholder not found');
				}
			}
			throw new InternalServerErrorException(
				'An error occurred while deleting the placeholder',
			);
		}
	}
}
