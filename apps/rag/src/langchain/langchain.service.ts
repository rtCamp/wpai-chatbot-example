import { Injectable } from '@nestjs/common';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

@Injectable()
export class LangchainService {
	async createChunks(
		text: string,
		size: number,
		overlap: number,
	): Promise<string[]> {
		const splitter = new RecursiveCharacterTextSplitter({
			chunkSize: size,
			chunkOverlap: overlap,
			separators: ['\n\n', '\n', '. ', ' ', ''], // Ordered by priority
		});

		return await splitter.splitText(text);
	}
}
