import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiSecurity,
} from '@nestjs/swagger';

import { CreateSharedChatDto } from '../../dto/shared-chat/create-shared-chat.dto';
import { ApiKeyGuard } from '../../guards/api-key.guard';

import { SharedChatService } from './shared-chat.service';

@ApiTags('shared-chat')
@UseGuards(ApiKeyGuard)
@ApiSecurity('api-key')
@Controller('shared-chat')
export class SharedChatController {
	constructor(private readonly sharedChatService: SharedChatService) {}

	@Post()
	@ApiOperation({ summary: 'Create a shared chat from a session' })
	@ApiResponse({
		status: 201,
		description: 'Shared chat created successfully.',
	})
	@ApiResponse({ status: 400, description: 'Invalid session ID.' })
	@ApiResponse({ status: 404, description: 'Session not found.' })
	async createSharedChat(@Body() createSharedChatDto: CreateSharedChatDto) {
		return this.sharedChatService.createSharedChat(
			createSharedChatDto.sessionId,
		);
	}
}
