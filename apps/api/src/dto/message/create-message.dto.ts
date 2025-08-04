import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateMessageDto {
	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	sessionId: string;

	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	query: string;

	@ApiProperty({ required: false })
	@IsString()
	@IsOptional()
	response?: string;

	@ApiProperty({ required: false, default: 'pending' })
	@IsString()
	@IsOptional()
	status?: string;

	@ApiProperty({ required: true })
	@IsString()
	@IsNotEmpty()
	captchaToken: string;

	@ApiProperty({ required: false })
	@IsString()
	@IsOptional()
	pageUrl?: string;
}
