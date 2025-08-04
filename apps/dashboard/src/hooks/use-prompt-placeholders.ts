import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@wpai-chatbot/dashboard/lib/api';

interface Placeholder {
	id: string;
	key: string;
	value: string;
	type: string;
	clientId: string;
}

interface DefaultPlaceholder {
	id: string;
	key: string;
	value: string;
	type: string;
}

interface CreatePlaceholderDto {
	key: string;
	value: string;
	type: string;
	clientId: string;
}

interface UpdatePlaceholderDto {
	value: string;
}

export function usePromptPlaceholders(clientId: string, promptType: string) {
	const queryClient = useQueryClient();

	const { data: placeholders, isLoading } = useQuery<
		Array<Placeholder | DefaultPlaceholder>
	>({
		queryKey: ['promptPlaceholders', clientId, promptType],
		queryFn: async () => {
			let combinedPlaceholders: Array<Placeholder | DefaultPlaceholder> =
				[];
			const [clientPlaceholders, defaultPlaceholdersData] =
				await Promise.all([
					fetchApi(`/prompt-placeholders/client/${clientId}`),
					fetchApi('/default-placeholders'),
				]);

			combinedPlaceholders = [...clientPlaceholders];

			defaultPlaceholdersData.forEach(
				(placeholder: DefaultPlaceholder) => {
					const exists = combinedPlaceholders.some(
						(p: Placeholder | DefaultPlaceholder) =>
							p.key === placeholder.key &&
							p.type === placeholder.type,
					);
					if (!exists) {
						combinedPlaceholders.push({
							...placeholder,
							id: `default-${placeholder.key}-${placeholder.type}`,
						});
					}
				},
			);

			return combinedPlaceholders.filter((p) => p.type === promptType);
		},
	});

	const createMutation = useMutation<
		Placeholder,
		Error,
		CreatePlaceholderDto
	>({
		mutationFn: async (data: CreatePlaceholderDto) => {
			const response = await fetchApi('/prompt-placeholders', {
				method: 'POST',
				body: JSON.stringify(data),
			});
			if (response.error) {
				throw new Error(response.error);
			}
			return response;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['promptPlaceholders', clientId, promptType],
			});
		},
	});

	const updateMutation = useMutation<
		Placeholder,
		Error,
		{ id: string } & UpdatePlaceholderDto
	>({
		mutationFn: async ({ id, ...data }) => {
			const response = await fetchApi(`/prompt-placeholders/${id}`, {
				method: 'PATCH',
				body: JSON.stringify(data),
			});
			if (response.error) {
				throw new Error(response.error);
			}
			return response;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['promptPlaceholders', clientId, promptType],
			});
		},
	});

	const deleteMutation = useMutation<void, Error, string>({
		mutationFn: async (id: string) => {
			const response = await fetchApi(`/prompt-placeholders/${id}`, {
				method: 'DELETE',
			});
			if (response?.error) {
				throw new Error(response.error);
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['promptPlaceholders', clientId, promptType],
			});
		},
	});

	return {
		placeholders,
		isLoading,
		createPlaceholder: createMutation.mutateAsync,
		updatePlaceholder: updateMutation.mutateAsync,
		deletePlaceholder: deleteMutation.mutateAsync,
	};
}
