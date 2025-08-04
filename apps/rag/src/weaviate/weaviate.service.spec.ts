import { Test, TestingModule } from '@nestjs/testing';

import { WeaviateService } from './weaviate.service';

describe('WeaviateService', () => {
	let service: WeaviateService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [WeaviateService],
		}).compile();

		service = module.get<WeaviateService>(WeaviateService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});
});
