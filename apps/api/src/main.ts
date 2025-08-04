import { randomUUID } from 'crypto';

import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';

import { AppModule } from './app.module';

if (!(global as any).crypto) {
	(global as any).crypto = {
		randomUUID,
	};
}

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	// Config
	const configService = app.get(ConfigService);

	// Conditional Swagger setup
	if (
		['local', 'dev', 'develop', 'development'].includes(
			configService.get<string>('NODE_ENV')?.toLowerCase() || '',
		)
	) {
		const swaggerConfig = new DocumentBuilder()
			.setTitle('WPAI_Chatbot API')
			.setDescription('Documentation for the WPAI_Chatbot API.')
			.setVersion('0.0.1')
			.setContact(
				'Danish Shakeel, rtCamp',
				'https://rtcamp.com',
				'contact@rtcamp.com',
			)
			.addApiKey(
				{
					type: 'apiKey',
					name: 'X-API-KEY',
					in: 'header',
					description: 'API key for authentication',
				},
				'api-key',
			)
			.build();

		const documentFactory = () =>
			SwaggerModule.createDocument(app, swaggerConfig);

		SwaggerModule.setup('docs', app, documentFactory, {
			jsonDocumentUrl: 'docs/json',
			yamlDocumentUrl: 'docs/yaml',
			customSiteTitle: 'WPAI_Chatbot API Docs',
			swaggerOptions: {
				security: [
					{
						'api-key': [],
					},
				],
				persistAuthorization: true,
			},
		});
	}

	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			transform: true,
			transformOptions: { enableImplicitConversion: true },
		}),
	);

	app.enableCors({
		origin: '*',
		methods: 'GET,POST,PUT,DELETE,OPTIONS,PATCH',
		allowedHeaders: 'Content-Type, X-API-KEY',
		credentials: true,
	});

	await app.listen(3000);
}

bootstrap();
