import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { LangchainService } from './langchain.service';

@Module({
	imports: [ConfigModule],
	providers: [LangchainService],
	exports: [LangchainService],
})
export class LangchainModule {}
