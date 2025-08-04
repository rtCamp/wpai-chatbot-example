import { exit } from 'process';

import { Command, CommandRunner } from 'nest-commander';
import { PineconeService } from '@rag/pinecone/pinecone.service';
import { WeaviateService } from '@rag/weaviate/weaviate.service';

@Command({
	name: 'load-json',
	description: 'Load JSON from path, chunk, upsert into Pinecone',
})
export class LoadJsonCommand extends CommandRunner {
	constructor(
		private readonly pineconeService: PineconeService,
		private readonly weaviateService: WeaviateService,
	) {
		super();
	}

	async run(passedParams: string[]): Promise<void> {
		const jsonPath = passedParams[0];
		if (!jsonPath) {
			console.error('Please provide a JSON file path');
			exit(-1);
		}

		await this.weaviateService.loadJsonIntoWeaviate(
			jsonPath,
			this.weaviateService.collection,
		);
	}

	async runPinecone(passedParams: string[]): Promise<void> {
		const jsonPath = passedParams[0];
		if (!jsonPath) {
			console.error('Please provide a JSON file path');
			exit(-1);
		}

		await this.pineconeService.loadJsonIntoPinecone(jsonPath);
	}
}
