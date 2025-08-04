import {
	Controller,
	Get,
	Post,
	Delete,
	Param,
	Body,
	Patch,
	Query,
	UseGuards,
	Res,
	HttpStatus,
	NotFoundException,
} from '@nestjs/common';
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiQuery,
	ApiSecurity,
} from '@nestjs/swagger';
import { UpdateMessageDto } from '@wpai-chatbot/dto/message/update-message.dto';
import { CreateMessageDto } from '@wpai-chatbot/dto/message/create-message.dto';
import { SearchMessageDto } from '@wpai-chatbot/dto/message/search-message.dto';
import { Throttle } from '@nestjs/throttler';
import { ApiKeyGuard } from '@wpai-chatbot/guards/api-key.guard';
import { FilterMessageDto } from '@wpai-chatbot/dto/message/filter-message.dto';
import { Response } from 'express';

import { SummarizerService } from '../pipelines/ai/summarizer.service';

import { MessagesService } from './messages.service';

@Controller('messages')
@UseGuards(ApiKeyGuard)
@ApiTags('Messages')
@ApiSecurity('api-key')
export class MessagesController {
	constructor(
		private messageService: MessagesService,
		private summarizerService: SummarizerService,
	) {}

	@Get()
	@ApiOperation({ summary: 'Find all messages' })
	@ApiResponse({
		status: 200,
		description: 'Messages retrieved successfully',
	})
	@ApiQuery({ name: 'page', required: false, type: Number, default: 1 })
	@ApiQuery({ name: 'limit', required: false, type: Number, default: 10 })
	@ApiQuery({ name: 'sessionId', required: false, type: String })
	@ApiQuery({ name: 'status', required: false, type: String })
	findAll(@Query() filterDto: FilterMessageDto) {
		return this.messageService.findAll(filterDto);
	}

	@Get(':id')
	@ApiOperation({ summary: 'Find message by id' })
	@ApiResponse({ status: 200, description: 'Message found' })
	findOne(@Param('id') id: string) {
		return this.messageService.findOne(id);
	}

	@Get(':id/stream')
	@ApiOperation({ summary: 'Stream message response' })
	@ApiResponse({ status: 200, description: 'Message streaming started' })
	async streamMessage(
		@Param('id') id: string,
		@Res() response: Response,
	): Promise<void> {
		try {
			const message = await this.messageService.findOne(id);

			if (!message) {
				throw new NotFoundException(`Message with ID ${id} not found`);
			}

			response.setHeader('Content-Type', 'text/event-stream');
			response.setHeader(
				'Cache-Control',
				'no-cache, no-store, must-revalidate',
			);
			response.setHeader('Connection', 'keep-alive');
			response.setHeader('Access-Control-Allow-Origin', '*');
			response.setHeader('X-Accel-Buffering', 'no');

			response.write(
				`data: ${JSON.stringify({
					content: '',
					initializing: true,
					progress: 'Connecting to assistant...',
					done: false,
				})}\n\n`,
			);
			response.flushHeaders();

			if (message.status === 'completed' || message.status === 'failed') {
				try {
					let responseContent = '';
					let responseResults = [];

					if (message.response) {
						try {
							const responseData = JSON.parse(message.response);
							responseContent = responseData.answer || '';
							responseResults = responseData.results || []; // Remove filtering
						} catch {
							responseContent = message.response;
						}
					} else if (message.status === 'failed') {
						responseContent = 'Message processing failed.';
					}

					response.write(
						`data: ${JSON.stringify({
							content: responseContent,
							done: false,
						})}\n\n`,
					);
					response.flushHeaders();

					response.write(
						`data: ${JSON.stringify({
							content: '',
							results: responseResults,
							done: true,
							type: message.type,
						})}\n\n`,
					);

					response.end();
				} catch (error) {
					console.error(
						'Error handling completed/failed message:',
						error,
					);

					response.write(
						`data: ${JSON.stringify({
							content: `Error processing message: ${error.message}`,
							done: false,
						})}\n\n`,
					);

					response.write(
						`data: ${JSON.stringify({
							content: '',
							done: true,
							type: message.type,
						})}\n\n`,
					);

					response.end();
				}
			} else if (message.status === 'processing') {
				try {
					let initialContent = '';
					let initialLength = 0;

					if (message.response) {
						try {
							const responseData = JSON.parse(message.response);
							initialContent = responseData.answer || '';
							initialLength = initialContent.length;

							if (initialContent) {
								response.write(
									`data: ${JSON.stringify({
										content: initialContent,
										done: false,
									})}\n\n`,
								);
								response.flushHeaders();
							}
						} catch (parseError) {
							console.error(
								'Error parsing initial response:',
								parseError,
							);
						}
					}

					this.streamWithPolling(id, response, initialLength, true);
				} catch (error) {
					console.error('Error handling processing state:', error);

					response.write(
						`data: ${JSON.stringify({
							content: `Error processing partial response: ${error.message}`,
							done: false,
						})}\n\n`,
					);

					response.write(
						`data: ${JSON.stringify({
							content: '',
							done: true,
							type: message.type,
						})}\n\n`,
					);

					response.end();
				}
			} else if (message.status === 'pending') {
				const messageAny = message as any;

				if (messageAny.retrieval_result) {
					try {
						const retrievedData = JSON.parse(
							messageAny.retrieval_result,
						);
						const sessionId = message.sessionId;

						const searchParams = messageAny.searchParams
							? JSON.parse(messageAny.searchParams)
							: null;

						const messageType =
							message.type || searchParams?.type || 'retrieval';

						const summarizerQuery =
							await this.summarizerService.prepare(
								retrievedData,
								messageType === 'retrieval_date_decay',
							);

						await this.summarizerService.summarize(
							summarizerQuery,
							sessionId,
							response,
						);
					} catch (error) {
						console.error('Streaming error:', error);

						response.write(
							`data: ${JSON.stringify({
								content: `Error during streaming: ${error.message}`,
								done: false,
							})}\n\n`,
						);

						response.write(
							`data: ${JSON.stringify({
								content: '',
								done: true,
								type: message.type,
							})}\n\n`,
						);

						response.end();
					}
				} else {
					this.streamWithPolling(id, response, 0, true);
				}
			} else {
				response.write(
					`data: ${JSON.stringify({
						content: `Message is in ${message.status} state.`,
						done: false,
					})}\n\n`,
				);

				response.write(
					`data: ${JSON.stringify({
						content: '',
						done: true,
						type: message.type,
					})}\n\n`,
				);

				response.end();
			}
		} catch (error) {
			console.error('Stream setup error:', error);

			response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
				message: 'Error setting up streaming',
				error: error.message,
			});
		}
	}

	private async streamWithPolling(
		messageId: string,
		response: Response,
		lastContentLength: number = 0,
		headersAlreadySet: boolean = false,
	): Promise<void> {
		if (!headersAlreadySet) {
			response.setHeader('Content-Type', 'text/event-stream');
			response.setHeader(
				'Cache-Control',
				'no-cache, no-store, must-revalidate',
			);
			response.setHeader('Connection', 'keep-alive');
			response.setHeader('X-Accel-Buffering', 'no');
		}

		let isEnded = false;

		const endResponse = (messageType) => {
			if (!isEnded) {
				isEnded = true;

				response.write(
					`data: ${JSON.stringify({
						content: '',
						done: true,
						type: messageType,
					})}\n\n`,
				);

				response.end();
			}
		};

		response.write(
			`data: ${JSON.stringify({
				content: '',
				initializing: true,
				progress: 'Connecting to assistant...',
				done: false,
			})}\n\n`,
		);
		response.flushHeaders();

		let attempts = 0;
		const maxAttempts = 600;

		let pollingInterval = 100;
		const baseInterval = 100;
		const maxInterval = 1000;

		let lastLength = lastContentLength;
		let noUpdateCount = 0;

		const checkStatus = async (): Promise<void> => {
			if (isEnded) {
				return;
			}

			const message = await this.messageService.findOne(messageId);

			try {
				if (message.status === 'completed' && message.response) {
					try {
						if (
							typeof message.response === 'string' &&
							message.response.startsWith('string')
						) {
							response.write(
								`data: ${JSON.stringify({
									content: '',
									results: [],
									done: false,
								})}\n\n`,
							);
							endResponse(message.type);
							return;
						}

						const responseData = JSON.parse(message.response);
						const results = responseData.results || []; // Remove filtering

						if (
							responseData.answer &&
							responseData.answer.length > lastLength
						) {
							const newContent =
								responseData.answer.substring(lastLength);

							response.write(
								`data: ${JSON.stringify({
									content: newContent,
									done: false,
								})}\n\n`,
							);
							response.flushHeaders();
						}

						response.write(
							`data: ${JSON.stringify({
								content: '',
								results: results,
								done: true,
								type: message.type,
							})}\n\n`,
						);
						endResponse(message.type);
						return;
					} catch (error) {
						console.error(
							`Error parsing completed response: ${error.message}`,
						);
						response.write(
							`data: ${JSON.stringify({
								content:
									'Error parsing completed message response',
								done: false,
							})}\n\n`,
						);
						endResponse(message.type);
						return;
					}
				} else if (
					message.status === 'processing' &&
					message.response
				) {
					try {
						if (
							typeof message.response === 'string' &&
							message.response.startsWith('string')
						) {
							noUpdateCount++;
						} else {
							const responseData = JSON.parse(message.response);
							if (responseData && responseData.answer) {
								const currentAnswer = responseData.answer;

								if (currentAnswer.length > lastLength) {
									const newContent =
										currentAnswer.substring(lastLength);

									response.write(
										`data: ${JSON.stringify({
											content: newContent,
											done: false,
										})}\n\n`,
									);
									response.flushHeaders();

									lastLength = currentAnswer.length;
									noUpdateCount = 0;

									pollingInterval = baseInterval;
								} else {
									noUpdateCount++;

									if (noUpdateCount > 5) {
										pollingInterval = Math.min(
											pollingInterval * 1.2,
											maxInterval,
										);
									}
								}
							} else {
								noUpdateCount++;
							}
						}
					} catch (error) {
						console.error(
							`Error parsing processing response: ${error.message}`,
						);
						noUpdateCount++;
					}
				} else if (
					message.status === 'failed' ||
					message.status === 'cancelled'
				) {
					response.write(
						`data: ${JSON.stringify({
							content: `Message processing ${message.status}.`,
							done: false,
						})}\n\n`,
					);

					response.write(
						`data: ${JSON.stringify({
							content: '',
							done: true,
							type: message.type,
						})}\n\n`,
					);
					endResponse(message.type);
					return;
				} else {
					noUpdateCount++;

					pollingInterval = Math.min(
						pollingInterval * 1.05,
						maxInterval,
					);
				}

				attempts++;
				if (attempts >= maxAttempts) {
					response.write(
						`data: ${JSON.stringify({
							content: 'Processing timeout after 5 minutes.',
							done: false,
						})}\n\n`,
					);

					response.write(
						`data: ${JSON.stringify({
							content: '',
							done: true,
							type: message.type,
						})}\n\n`,
					);
					endResponse(message.type);
					return;
				}

				if (!isEnded) {
					setTimeout(checkStatus, pollingInterval);
				}
			} catch (error) {
				console.error(`Polling error: ${error.message}`);
				response.write(
					`data: ${JSON.stringify({
						content: 'Error during polling: ' + error.message,
						done: false,
					})}\n\n`,
				);

				response.write(
					`data: ${JSON.stringify({
						content: '',
						done: true,
						type: message.type,
					})}\n\n`,
				);
				endResponse(message.type);
			}
		};

		checkStatus();
	}

	@Get('session/:sessionId')
	@ApiOperation({ summary: 'Find messages by session id' })
	@ApiResponse({ status: 200, description: 'Messages found' })
	@ApiQuery({ name: 'page', required: false, type: Number, default: 1 })
	@ApiQuery({ name: 'limit', required: false, type: Number, default: 10 })
	@ApiQuery({ name: 'status', required: false, type: String })
	@ApiQuery({ name: 'sort', required: false, type: String })
	findAllBySession(
		@Param('sessionId') sessionId: string,
		@Query('page') page?: number,
		@Query('limit') limit?: number,
		@Query('status') status?: string,
		@Query('sort') sort?: string,
	) {
		return this.messageService.findAllBySession(sessionId, {
			page: page ? Number(page) : 1,
			limit: limit ? Number(limit) : 10,
			status,
			sort: sort || 'desc',
		});
	}

	@Post()
	@Throttle({ default: { limit: 10, ttl: 60000 } })
	@ApiOperation({ summary: 'Create message' })
	@ApiResponse({ status: 201, description: 'Message created' })
	create(@Body() createMessageDto: CreateMessageDto) {
		return this.messageService.create(createMessageDto);
	}

	@Patch(':id')
	@ApiOperation({ summary: 'Update message' })
	@ApiResponse({ status: 200, description: 'Message updated' })
	update(
		@Param('id') id: string,
		@Body() updateMessageDto: UpdateMessageDto,
	) {
		return this.messageService.update(id, updateMessageDto);
	}

	@Delete(':id')
	@ApiOperation({ summary: 'Delete message' })
	@ApiResponse({ status: 200, description: 'Message deleted' })
	delete(@Param('id') id: string) {
		return this.messageService.delete(id);
	}

	@Post('/search')
	@ApiOperation({ summary: 'Return Search Result' })
	@ApiResponse({ status: 200, description: 'Messages found' })
	search(@Body() searchMessageDto: SearchMessageDto) {
		return this.messageService.search(searchMessageDto);
	}
}
