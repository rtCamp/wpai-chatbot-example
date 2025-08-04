import { Injectable } from '@nestjs/common';

import { HealthCheckResponse } from './interfaces/app.interface';

@Injectable()
export class AppService {
	constructor() {}
	getHealthStatus(): HealthCheckResponse {
		return {
			status: 'Hello from WPAI_Chatbot API',
			timestamp: Date.now(),
		};
	}
}
