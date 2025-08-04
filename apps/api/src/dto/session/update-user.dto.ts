import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	name?: string;

	@ApiProperty()
	@IsEmail()
	email: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	track_uid?: string;
}
