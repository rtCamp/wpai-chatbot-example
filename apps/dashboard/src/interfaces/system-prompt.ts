export enum PromptType {
	system = 'system',
	inference = 'inference',
	queryProcessor = 'queryProcessor',
}

export interface SystemPrompt {
	id: string;
	prompt: string;
	clientId: string;
	type: PromptType;
	isDefault?: boolean; // Optional field to indicate if it's a default prompt
}

export interface CreateSystemPromptDto {
	prompt: string;
	clientId: string;
	type?: PromptType;
}

export interface UpdateSystemPromptDto {
	prompt?: string;
	clientId?: string;
	type?: PromptType;
}
