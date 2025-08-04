import { CommandFactory } from 'nest-commander';
import { NestFactory } from '@nestjs/core';

import { CommandsModule } from './commands/commands.module';
import { AppModule } from './app.module';

async function bootstrap() {
	// Check if running in CLI mode
	const isCLI = process.argv.includes('--cli');

	if (isCLI) {
		await CommandFactory.run(CommandsModule, {
			logger: ['error', 'warn', 'log'],
		});
	} else {
		const app = await NestFactory.create(AppModule);
		await app.listen(3300);
	}
}
bootstrap();
