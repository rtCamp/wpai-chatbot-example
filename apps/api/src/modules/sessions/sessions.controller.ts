import {
	Controller,
	Get,
	Post,
	Delete,
	Param,
	Query,
	Body,
	HttpCode,
	UseGuards,
	Patch,
} from '@nestjs/common';
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiQuery,
	ApiParam,
	ApiBody,
	ApiSecurity,
} from '@nestjs/swagger';
import { CreateSessionDto } from '@wpai-chatbot/dto/session/create-session.dto';
import { UpdateUserDto } from '@wpai-chatbot/dto/session/update-user.dto';
import { ApiKeyGuard } from '@wpai-chatbot/guards/api-key.guard';
import { FilterSessionDto } from '@wpai-chatbot/dto/session/filter-session.dto';
import { Throttle } from '@nestjs/throttler';
import { CreateSessionFromSharedChatDto } from '@wpai-chatbot/dto/session/create-session-from-shared-chat.dto';

import { SessionsService } from './sessions.service';

@Controller('sessions')
@UseGuards(ApiKeyGuard)
@ApiTags('Sessions')
@ApiSecurity('api-key')
export class SessionsController {
	constructor(private readonly sessionsService: SessionsService) {}

	@Get()
	@ApiOperation({ summary: 'Get all sessions with pagination and filters' })
	@ApiResponse({
		status: 200,
		description: 'Sessions retrieved successfully',
	})
	@ApiQuery({ name: 'page', required: false, type: Number, default: 1 })
	@ApiQuery({ name: 'limit', required: false, type: Number, default: 10 })
	@ApiQuery({ name: 'clientId', required: false, type: String })
	@ApiQuery({ name: 'startDate', required: false, type: Date })
	@ApiQuery({ name: 'endDate', required: false, type: Date })
	@ApiQuery({ name: 'includeEmpty', required: false, type: Boolean })
	async findAll(@Query() filterDto: FilterSessionDto) {
		return this.sessionsService.findAll(filterDto);
	}

	@Get('/user/:id')
	@ApiOperation({ summary: 'Get session by userID' })
	@ApiResponse({ status: 200, description: 'Session retrieved successfully' })
	@ApiResponse({ status: 404, description: 'Session not found' })
	@ApiParam({ name: 'id', type: 'string' })
	findAllByUserId(@Param('id') id: string) {
		return this.sessionsService.findAllByUserId(id);
	}

	@Patch('/user/:id')
	@ApiOperation({ summary: 'Update user by userID' })
	@ApiResponse({ status: 200, description: 'User updated successfully' })
	@ApiResponse({ status: 404, description: 'User not found' })
	@ApiParam({ name: 'id', type: 'string' })
	@ApiBody({
		type: UpdateUserDto,
	})
	updateUserById(
		@Param('id') id: string,
		@Body() updateUserDto: UpdateUserDto,
	) {
		return this.sessionsService.updateUserById(id, updateUserDto);
	}

	@Get(':id')
	@ApiOperation({ summary: 'Get session by ID' })
	@ApiResponse({ status: 200, description: 'Session retrieved successfully' })
	@ApiResponse({ status: 404, description: 'Session not found' })
	@ApiParam({ name: 'id', type: 'string' })
	findOne(@Param('id') id: string) {
		return this.sessionsService.findOne(id);
	}

	@Post()
	@Throttle({ default: { limit: 10, ttl: 60000 } })
	@HttpCode(201)
	@ApiBody({
		type: CreateSessionDto,
	})
	@ApiOperation({ summary: 'Create new session' })
	@ApiResponse({ status: 201, description: 'Session created successfully' })
	create(@Body() createSessionDto: CreateSessionDto) {
		return this.sessionsService.create(createSessionDto);
	}

	@Delete(':id')
	@HttpCode(204)
	@ApiOperation({ summary: 'Delete session' })
	@ApiResponse({ status: 204, description: 'Session deleted successfully' })
	@ApiResponse({ status: 404, description: 'Session not found' })
	@ApiParam({ name: 'id', type: 'string' })
	delete(@Param('id') id: string) {
		return this.sessionsService.delete(id);
	}

	@Post('create-from-shared-chat')
	@ApiOperation({ summary: 'Create a new session from a shared chat' })
	@ApiResponse({
		status: 201,
		description: 'Session created successfully.',
	})
	@ApiResponse({ status: 400, description: 'Invalid shared chat ID.' })
	@ApiResponse({ status: 404, description: 'Shared chat not found.' })
	async createFromSharedChat(
		@Body() createFromSharedDto: CreateSessionFromSharedChatDto,
	) {
		return this.sessionsService.createFromSharedChat(createFromSharedDto);
	}
}
