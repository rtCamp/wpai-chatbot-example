import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSessionFromSharedChatDto {
	@ApiProperty({
		description: 'ID of the shared chat to create session from',
		example: 'clh2j3k4m0000qw9j7r8j9q1q',
	})
	@IsString()
	@IsNotEmpty()
	sharedChatId: string;

	@ApiProperty({
		description: 'User ID for the new session',
		example: 'user123',
	})
	@IsString()
	@IsNotEmpty()
	userId: string;

	@IsString()
	@ApiProperty({
		name: 'name',
		type: 'string',
		required: false,
	})
	@IsOptional()
	name?: string;

	@IsString()
	@ApiProperty({
		name: 'email',
		type: 'string',
		required: false,
	})
	@IsOptional()
	email?: string;
}
