import { PromptType } from '@prisma/client';
import axios from 'axios';

// Create an axios instance with base URL
const api = axios.create({
	baseURL: process.env.API_BASE_URL || 'http://localhost:3000',
	// Add any common headers if needed
	headers: {
		'Content-Type': 'application/json',
	},
});

/**
 * Replaces placeholders in a system prompt with values from client-specific or default placeholders
 * @param systemPrompt The prompt containing placeholders in {{{key}}} format
 * @param clientId The client ID to fetch specific placeholders for
 * @param type The type of prompt (system, inference, etc.)
 * @returns The processed prompt with placeholders replaced
 */
export async function replacePlaceholders(
	systemPrompt: string,
	clientId: string,
	type: PromptType,
): Promise<string> {
	try {
		// Fetch all placeholders in parallel
		const [clientPlaceholders, defaultPlaceholders] = await Promise.all([
			getClientPlaceholders(clientId),
			getDefaultPlaceholders(),
		]);

		// Extract placeholders from the system prompt
		const placeholderRegex = /{{{([^}]+)}}}/g;
		const matches = systemPrompt.match(placeholderRegex) || [];
		const placeholders = matches.map((match) => match.slice(3, -3));

		let processedPrompt = systemPrompt;

		// Replace each placeholder
		for (const placeholder of placeholders) {
			// Try client placeholder first, then default, then empty string
			const clientPlaceholder = clientPlaceholders.find(
				(p) => p.key === placeholder && p.type === type,
			);
			const defaultPlaceholder = defaultPlaceholders.find(
				(p) => p.key === placeholder && p.type === type,
			);

			const value =
				clientPlaceholder?.value || defaultPlaceholder?.value || '';
			processedPrompt = processedPrompt.replace(
				new RegExp(`{{{${placeholder}}}}`, 'g'),
				value,
			);
		}

		return processedPrompt;
	} catch (error) {
		console.error('Error processing prompt placeholders:', error);
		// In case of error, return the original prompt with placeholders removed
		return systemPrompt.replace(/{{{[^}]+}}}/g, '');
	}
}

async function getClientPlaceholders(clientId: string) {
	try {
		const response = await api.get(
			`/prompt-placeholders/client/${clientId}`,
		);
		return response.data;
	} catch (error) {
		console.error('Error fetching client placeholders:', error);
		return [];
	}
}

async function getDefaultPlaceholders() {
	try {
		const response = await api.get('/default-placeholders');
		return response.data;
	} catch (error) {
		console.error('Error fetching default placeholders:', error);
		return [];
	}
}
