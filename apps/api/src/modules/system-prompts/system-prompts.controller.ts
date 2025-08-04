import {
	Controller,
	Post,
	Get,
	Body,
	Param,
	UseGuards,
	Patch,
	Delete,
} from '@nestjs/common';
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiSecurity,
	ApiParam,
} from '@nestjs/swagger';
import { ApiKeyGuard } from '@wpai-chatbot/guards/api-key.guard';
import { Throttle } from '@nestjs/throttler';

import { CreateSystemPromptDto } from '../../dto/system-prompt/create-system-prompt.dto';
import { UpdateSystemPromptDto } from '../../dto/system-prompt/update-system-prompt.dto';

import { SystemPromptsService } from './system-prompts.service';

@Controller('system-prompts')
@UseGuards(ApiKeyGuard)
@ApiTags('System Prompts')
@ApiSecurity('api-key')
export class SystemPromptsController {
	constructor(private readonly systemPromptsService: SystemPromptsService) {}

	@Post()
	@Throttle({ default: { limit: 10, ttl: 60000 } })
	@ApiOperation({ summary: 'Create a new system prompt' })
	@ApiResponse({
		status: 201,
		description: 'System prompt created successfully',
	})
	create(@Body() createSystemPromptDto: CreateSystemPromptDto) {
		return this.systemPromptsService.create(createSystemPromptDto);
	}

	@Get('client/:clientId')
	@ApiOperation({ summary: 'Get all prompts for a client' })
	@ApiResponse({
		status: 200,
		description: 'System prompts retrieved successfully',
	})
	findAllByClient(@Param('clientId') clientId: string) {
		return this.systemPromptsService.findAllByClient(clientId);
	}

	@Get()
	@ApiOperation({ summary: 'Get all system prompts' })
	@ApiResponse({
		status: 200,
		description: 'System prompts retrieved successfully',
	})
	findAll() {
		return this.systemPromptsService.findAll();
	}

	@Patch(':id')
	@ApiOperation({ summary: 'Update a system prompt' })
	@ApiResponse({
		status: 200,
		description: 'System prompt updated successfully',
	})
	@ApiResponse({ status: 404, description: 'System prompt not found' })
	@ApiParam({ name: 'id', description: 'System prompt ID' })
	update(
		@Param('id') id: string,
		@Body() updateSystemPromptDto: UpdateSystemPromptDto,
	) {
		return this.systemPromptsService.update(id, updateSystemPromptDto);
	}

	@Delete(':id')
	@ApiOperation({ summary: 'Delete a system prompt' })
	@ApiResponse({
		status: 200,
		description: 'System prompt deleted successfully',
	})
	@ApiResponse({ status: 404, description: 'System prompt not found' })
	@ApiParam({ name: 'id', description: 'System prompt ID' })
	remove(@Param('id') id: string) {
		return this.systemPromptsService.remove(id);
	}
}
