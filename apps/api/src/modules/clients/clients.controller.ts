import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '@wpai-chatbot/guards/api-key.guard';
import { ApiOperation, ApiParam, ApiSecurity, ApiTags } from '@nestjs/swagger';

import { ClientsService } from './clients.service';

@Controller('clients')
@UseGuards(ApiKeyGuard)
@ApiTags('Clients')
@ApiSecurity('api-key')
export class ClientsController {
	constructor(private readonly clientsService: ClientsService) {}

	@Get()
	@ApiOperation({ summary: 'Get all clients' })
	findAll() {
		return this.clientsService.findAll();
	}

	@Get('/:id/latest-messages')
	@ApiOperation({ summary: 'Get latest message for a client' })
	@ApiParam({ name: 'id', description: 'Client ID' })
	getLatestMessages(@Param('id') clientId: string) {
		return this.clientsService.getLatestMessages(clientId);
	}
}
