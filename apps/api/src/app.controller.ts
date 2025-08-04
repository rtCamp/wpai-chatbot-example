import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { AppService } from './app.service';
import { HealthCheckResponse } from './interfaces/app.interface';

@Controller()
@ApiTags('App')
export class AppController {
	constructor(private readonly appService: AppService) {}

	@Get('/health-check')
	getHello(): HealthCheckResponse {
		return this.appService.getHealthStatus();
	}
}
