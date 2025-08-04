import {
	Controller,
	Get,
	Post,
	Body,
	Patch,
	Param,
	Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreatePromptPlaceholderDto } from '@wpai-chatbot/dto/prompt-placeholders/create-prompt-placeholder.dto';
import { UpdatePromptPlaceholderDto } from '@wpai-chatbot/dto/prompt-placeholders/update-prompt-placeholder.dto';

import { PromptPlaceholdersService } from './prompt-placeholders.service';

@ApiTags('prompt-placeholders')
@Controller('prompt-placeholders')
export class PromptPlaceholdersController {
	constructor(
		private readonly promptPlaceholdersService: PromptPlaceholdersService,
	) {}

	@Post()
	@ApiOperation({ summary: 'Create a new prompt placeholder' })
	@ApiResponse({
		status: 201,
		description: 'The prompt placeholder has been created.',
	})
	create(@Body() createPromptPlaceholderDto: CreatePromptPlaceholderDto) {
		return this.promptPlaceholdersService.create(
			createPromptPlaceholderDto,
		);
	}

	@Get()
	@ApiOperation({ summary: 'Get all prompt placeholders' })
	@ApiResponse({
		status: 200,
		description: 'Return all prompt placeholders.',
	})
	findAll() {
		return this.promptPlaceholdersService.findAll();
	}

	@Get('client/:clientId')
	@ApiOperation({ summary: 'Get prompt placeholders by client ID' })
	@ApiResponse({
		status: 200,
		description: 'Return prompt placeholders for a specific client.',
	})
	findByClientId(@Param('clientId') clientId: string) {
		return this.promptPlaceholdersService.findByClientId(clientId);
	}

	@Get(':id')
	@ApiOperation({ summary: 'Get a prompt placeholder by ID' })
	@ApiResponse({
		status: 200,
		description: 'Return the prompt placeholder.',
	})
	findOne(@Param('id') id: string) {
		return this.promptPlaceholdersService.findOne(id);
	}

	@Patch(':id')
	@ApiOperation({ summary: 'Update a prompt placeholder' })
	@ApiResponse({
		status: 200,
		description: 'The prompt placeholder has been updated.',
	})
	update(
		@Param('id') id: string,
		@Body() updatePromptPlaceholderDto: UpdatePromptPlaceholderDto,
	) {
		return this.promptPlaceholdersService.update(
			id,
			updatePromptPlaceholderDto,
		);
	}

	@Delete(':id')
	@ApiOperation({ summary: 'Delete a prompt placeholder' })
	@ApiResponse({
		status: 200,
		description: 'The prompt placeholder has been deleted.',
	})
	remove(@Param('id') id: string) {
		return this.promptPlaceholdersService.remove(id);
	}
}
