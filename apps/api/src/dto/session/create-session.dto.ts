import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateSessionDto {
	@IsString()
	@IsNotEmpty()
	@ApiProperty({
		name: 'clientId',
		type: 'string',
		required: true,
	})
	clientId: string;

	@IsString()
	@IsNotEmpty()
	@ApiProperty({
		name: 'userId',
		type: 'string',
		required: true,
	})
	userId: string;

	@IsString()
	@IsNotEmpty()
	@ApiProperty({
		name: 'name',
		type: 'string',
		required: true,
	})
	name: string;

	@IsString()
	@IsNotEmpty()
	@ApiProperty({
		name: 'email',
		type: 'string',
		required: true,
	})
	email: string;

	@IsString()
	@ApiProperty({
		name: 'userTimeZone',
		type: 'string',
		required: false,
	})
	userTimeZone?: string;
}
