import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@wpai-chatbot/dashboard/lib/api';

import {
	SystemPrompt,
	CreateSystemPromptDto,
	UpdateSystemPromptDto,
} from '../interfaces/system-prompt';

interface DefaultPrompts {
	[key: string]: string;
}

export function useSystemPrompts() {
	const queryClient = useQueryClient();

	const { data: prompts, isLoading } = useQuery<SystemPrompt[]>({
		queryKey: ['systemPrompts'],
		queryFn: async () => {
			let response = await fetchApi('/system-prompts');
			// Ensure we always return an array, even if empty
			const promptsFromDb = Array.isArray(response) ? response : [];
			const defaultPrompts = await defaultPromptsMutation.mutateAsync();

			response = await fetchApi('/clients');
			const clients: Array<string> = Array.isArray(response)
				? response
				: [];

			// Map through the prompts and add default prompts if they don't exist
			const combinedPrompts: Array<SystemPrompt> = [];

			clients.forEach((client) => {
				const clientPrompts = promptsFromDb.filter(
					(prompt) => prompt.clientId === client,
				);

				clientPrompts.forEach((prompt) => {
					combinedPrompts.push(prompt);
				});

				const defaultTypes = Object.keys(defaultPrompts);
				const existingTypes = clientPrompts.map(
					(prompt) => prompt.type,
				);

				// Add default prompts for each type that doesn't already exist for the client
				defaultTypes.forEach((type) => {
					if (!existingTypes.includes(type)) {
						combinedPrompts.push({
							id: `default-${client}-${type}`, // Use a placeholder ID for default prompts
							prompt: defaultPrompts[type],
							clientId: client,
							type: type as SystemPrompt['type'],
							isDefault: true,
						});
					}
				});
			});

			return combinedPrompts;
		},
	});

	const defaultPromptsMutation = useMutation<DefaultPrompts>({
		mutationFn: async () => {
			const response = await fetchApi('/default-prompts');
			return response as DefaultPrompts;
		},
	});

	const createMutation = useMutation<
		SystemPrompt,
		Error,
		CreateSystemPromptDto
	>({
		mutationFn: async (data: CreateSystemPromptDto) => {
			const response = await fetchApi('/system-prompts', {
				method: 'POST',
				body: JSON.stringify(data),
			});
			if (response.error) {
				throw new Error(response.error);
			}
			return response;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['systemPrompts'] });
		},
	});

	const updateMutation = useMutation<
		SystemPrompt,
		Error,
		UpdateSystemPromptDto & { id: string }
	>({
		mutationFn: async ({ id, ...data }) => {
			const response = await fetchApi(`/system-prompts/${id}`, {
				method: 'PATCH',
				body: JSON.stringify(data),
			});

			if (response.error) {
				throw new Error(response.error);
			}
			return response;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['systemPrompts'] });
		},
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) =>
			fetchApi(`/system-prompts/${id}`, {
				method: 'DELETE',
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['systemPrompts'] });
		},
	});

	return {
		prompts,
		isLoading,
		createPrompt: createMutation.mutateAsync,
		updatePrompt: updateMutation.mutateAsync,
		deletePrompt: deleteMutation.mutateAsync,
		fetchDefaultPrompts: defaultPromptsMutation.mutateAsync,
	};
}
