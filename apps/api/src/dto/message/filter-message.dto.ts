import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

import { PaginationDto } from '../pagination.dto';

export class FilterMessageDto extends PaginationDto {
	@ApiPropertyOptional({
		description:
			'The ID of the session for which messages are being filtered.',
		type: String,
		example: 'session_123',
	})
	@IsOptional()
	@IsString()
	sessionId?: string;

	@ApiPropertyOptional({
		description:
			'The status of the message (e.g., "completed", "failed", "processing").',
		type: String,
		example: 'completed',
	})
	@IsOptional()
	@IsString()
	status?: string;
}
