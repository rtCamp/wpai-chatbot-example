import { PromptType } from '@prisma/client';

export interface DefaultPromptPlaceholder {
	key: string;
	value: string;
	type: PromptType;
}

export const defaultPromptPlaceholders: DefaultPromptPlaceholder[] = [
	{
		key: 'tone',
		value: `- **Consultative**: Think strategic advisor, not pushy salesperson
- **Insightful**: Offer thoughtful perspectives and industry knowledge
- **Conversational**: Natural flow with appropriate personality
- **Professional**: Maintain expertise while being approachable`,
		type: 'system',
	},
	{
		key: 'language',
		value: 'English',
		type: 'system',
	},
	{
		key: 'response_length',
		value: `75-150 words for simple queries; up to 250 words for complex discussions`,
		type: 'system',
	},
];
