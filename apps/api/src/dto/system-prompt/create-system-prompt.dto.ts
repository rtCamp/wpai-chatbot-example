import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional } from 'class-validator';
import { PromptType } from '@prisma/client';

export class CreateSystemPromptDto {
	@ApiProperty({
		description: 'The content of the system prompt',
		example: 'You are a helpful assistant',
	})
	@IsString()
	prompt: string;

	@ApiProperty({
		description: 'Client ID',
		example: 'client123',
	})
	@IsString()
	clientId: string;

	@ApiProperty({
		description: 'Type of the prompt',
		enum: PromptType,
		default: 'system',
		required: false,
	})
	@IsEnum(PromptType)
	@IsOptional()
	type?: PromptType;
}
