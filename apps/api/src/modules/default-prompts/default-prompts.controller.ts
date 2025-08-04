import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '@wpai-chatbot/guards/api-key.guard';

import { GetDefaultPromptsResponseDto } from '../../dto/default-prompts/get-default-prompts.dto';
import defaultPrompts from '../../default-prompts';
@UseGuards(ApiKeyGuard)
@Controller('default-prompts')
export class DefaultPromptsController {
	@Get()
	async getDefaultPrompts(): Promise<GetDefaultPromptsResponseDto> {
		return {
			system: defaultPrompts.systemPrompt,
			inference: defaultPrompts.inferencePrompt,
			queryProcessor: defaultPrompts.queryProcessorPrompt,
		};
	}
}
