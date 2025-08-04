import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional } from 'class-validator';
import { PromptType } from '@prisma/client';

export class UpdatePromptPlaceholderDto {
	@ApiProperty({
		description: 'The key of the prompt placeholder',
		example: 'tone',
	})
	@IsString()
	@IsOptional()
	key?: string;

	@ApiProperty({
		description: 'The value of the prompt placeholder',
		example: 'friendly and professional',
	})
	@IsString()
	@IsOptional()
	value?: string;

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
