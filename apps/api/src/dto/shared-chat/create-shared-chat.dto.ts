import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSharedChatDto {
	@ApiProperty({
		description: 'ID of the session to create shared chat from',
	})
	@IsString()
	@IsNotEmpty()
	sessionId: string;
}
