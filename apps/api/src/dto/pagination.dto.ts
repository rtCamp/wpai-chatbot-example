import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class PaginationDto {
	@ApiPropertyOptional({
		description: 'Page number',
		type: Number,
	})
	@IsOptional()
	@IsNumber()
	page?: number = 1;

	@ApiPropertyOptional({
		description: 'Client ID to filter sessions by.',
		type: Number,
	})
	@IsOptional()
	@IsNumber()
	limit?: number = 10;
}
