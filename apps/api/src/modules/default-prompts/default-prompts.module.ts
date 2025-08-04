import { Module } from '@nestjs/common';

import { DefaultPromptsController } from './default-prompts.controller';

@Module({
	controllers: [DefaultPromptsController],
})
export class DefaultPromptsModule {}
