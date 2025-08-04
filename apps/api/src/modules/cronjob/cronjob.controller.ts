import { Controller, Post, Param } from '@nestjs/common';

import { CronjobService } from './cronjob.service';

@Controller('cronjob')
export class CronjobController {
	constructor(private readonly cronjobService: CronjobService) {}

	@Post('/frequency')
	async triggerManualCrawl(@Param('frequency') frequency: string) {
		return this.cronjobService['runScheduledCrawls'](frequency);
	}
}
