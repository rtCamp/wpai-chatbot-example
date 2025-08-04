import {
	CanActivate,
	ExecutionContext,
	Injectable,
	ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyGuard implements CanActivate {
	constructor(private configService: ConfigService) {}

	canActivate(context: ExecutionContext): boolean {
		const request = context.switchToHttp().getRequest();
		const apiKey = request.headers['x-api-key'];

		if (!apiKey || apiKey !== this.configService.get<string>('API_KEY')) {
			throw new ForbiddenException('Invalid API key');
		}

		return true;
	}
}
