import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import {
	RetrieveDataDto,
	RetrieveDataFusionDto,
} from '@wpai-chatbot/dto/pipelines/retriever.dto';
import { ApiKeyGuard } from 'src/guards/api-key.guard';
import { Throttle } from '@nestjs/throttler';
import { NerDto } from '@wpai-chatbot/dto/pipelines/ner.dto';
import { SummarizeDto } from '@wpai-chatbot/dto/pipelines/summarize.dto';

import { RetrieverService } from './ai/retriever.service';
import { NerService } from './ai/ner.service';
import { SummarizerService } from './ai/summarizer.service';

@Controller('pipelines')
@UseGuards(ApiKeyGuard)
@ApiTags('AI Pipelines')
@ApiSecurity('api-key')
export class PipelinesController {
	constructor(
		private readonly retrieverService: RetrieverService,
		private readonly nerService: NerService,
		private readonly summarizerService: SummarizerService,
	) {}

	@Post('/retrieve')
	@Throttle({ default: { limit: 3, ttl: 60000 } })
	retrieveData(@Body() payload: RetrieveDataDto) {
		return this.retrieverService.retrieveData(payload);
	}

	@Post('/retrieve-fusion')
	@Throttle({ default: { limit: 3, ttl: 60000 } })
	retrieveFusion(@Body() payload: RetrieveDataFusionDto) {
		return this.retrieverService.retrieveFusion(payload as any);
	}

	@Post('/retrieve-rrf')
	@Throttle({ default: { limit: 3, ttl: 60000 } })
	retrieveRRF(@Body() payload: RetrieveDataFusionDto) {
		return this.retrieverService.retrieveRRF(payload as any);
	}

	@Post('/ner')
	namedEntityRecognition(@Body() payload: NerDto) {
		return this.nerService.performNer(payload);
	}

	@Post('/:sessionId/summarize')
	summarizeData(
		@Param('sessionId') sessionId: string,
		@Body() payload: SummarizeDto,
	) {
		return this.summarizerService.summarize(payload, sessionId);
	}
}
