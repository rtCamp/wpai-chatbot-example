import { IsOptional, IsString, IsDateString, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

import { PaginationDto } from '../pagination.dto';

export class FilterSessionDto extends PaginationDto {
	@ApiPropertyOptional({
		description: 'Client ID to filter sessions by.',
		type: String,
		example: 'wordpress',
	})
	@IsOptional()
	@IsString()
	clientId?: string;

	@ApiPropertyOptional({
		description: 'User ID to filter sessions by.',
		type: String,
	})
	@IsOptional()
	@IsString()
	userId?: string;

	@ApiPropertyOptional({
		description:
			'Start date for filtering sessions. Must be an ISO 8601 date string.',
		type: String,
		format: 'date-time',
	})
	@IsOptional()
	@IsDateString()
	startDate?: Date;

	@ApiPropertyOptional({
		description:
			'End date for filtering sessions. Must be an ISO 8601 date string.',
		type: String,
		format: 'date-time',
	})
	@IsOptional()
	@IsDateString()
	endDate?: Date;

	@ApiPropertyOptional({
		description: 'Email address of the user',
		type: String,
	})
	@IsOptional()
	@IsString()
	userEmail?: string;

	@ApiPropertyOptional({
		description: 'Whether to include sessions with no messages',
		type: String,
	})
	@IsOptional()
	@IsBoolean()
	includeEmpty?: boolean;
}
