import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional } from 'class-validator';
import { PromptType } from '@prisma/client';

export class UpdateSystemPromptDto {
	@ApiProperty({
		description: 'The content of the system prompt',
		example: 'You are a helpful assistant',
	})
	@IsString()
	@IsOptional()
	prompt?: string;

	@ApiProperty({
		description: 'Client ID',
		example: 'client123',
	})
	@IsString()
	@IsOptional()
	clientId?: string;

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
