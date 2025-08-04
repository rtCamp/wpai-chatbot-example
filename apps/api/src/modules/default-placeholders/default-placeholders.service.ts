import { Injectable } from '@nestjs/common';
import {
	defaultPromptPlaceholders,
	DefaultPromptPlaceholder,
} from '@wpai-chatbot/fallbackPromptPlaceholders/defaultPromptPlaceholders';

@Injectable()
export class DefaultPlaceholdersService {
	findAll(): DefaultPromptPlaceholder[] {
		return defaultPromptPlaceholders;
	}
}
