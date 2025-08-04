import { Module } from '@nestjs/common';

import { DefaultPlaceholdersController } from './default-placeholders.controller';
import { DefaultPlaceholdersService } from './default-placeholders.service';

@Module({
	controllers: [DefaultPlaceholdersController],
	providers: [DefaultPlaceholdersService],
	exports: [DefaultPlaceholdersService],
})
export class DefaultPlaceholdersModule {}
