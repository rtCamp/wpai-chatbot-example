import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class SearchMessageDto {
	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	messageId: string;

	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	keywordWeight: string;
}
