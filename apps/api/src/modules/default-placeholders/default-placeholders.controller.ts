import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { DefaultPlaceholdersService } from './default-placeholders.service';

@ApiTags('default-placeholders')
@Controller('default-placeholders')
export class DefaultPlaceholdersController {
	constructor(
		private readonly defaultPlaceholdersService: DefaultPlaceholdersService,
	) {}

	@Get()
	@ApiOperation({ summary: 'Get all default prompt placeholders' })
	@ApiResponse({
		status: 200,
		description: 'Returns all default prompt placeholders.',
	})
	findAll() {
		return this.defaultPlaceholdersService.findAll();
	}
}
