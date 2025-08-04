'use client';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Button } from '@wpai-chatbot/dashboard/components/ui/button';
import { Textarea } from '@wpai-chatbot/dashboard/components/ui/textarea';
import { Label } from '@wpai-chatbot/dashboard/components/ui/label';
import { Input } from '@wpai-chatbot/dashboard/components/ui/input';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@wpai-chatbot/dashboard/components/ui/table';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from '@wpai-chatbot/dashboard/components/ui/dialog';
import { usePromptPlaceholders } from '@wpai-chatbot/dashboard/hooks/use-prompt-placeholders';

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

interface FormError {
	key?: string;
	value?: string;
	submit?: string;
}

const queryClient = new QueryClient();

function PlaceholdersContent() {
	const clientId = useSearchParams().get('clientId');
	const promptType = useSearchParams().get('promptType') || 'system';
	const {
		placeholders,
		isLoading,
		createPlaceholder,
		updatePlaceholder,
		deletePlaceholder,
	} = usePromptPlaceholders(clientId || '', promptType);

	const [selectedPlaceholder, setSelectedPlaceholder] = useState<
		Placeholder | DefaultPlaceholder | null
	>(null);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [editError, setEditError] = useState<FormError>({});
	const [createError, setCreateError] = useState<FormError>({});
	const [deleteError, setDeleteError] = useState<string>('');
	const [newPlaceholder, setNewPlaceholder] = useState<{
		key: string;
		value: string;
	}>({
		key: '',
		value: '',
	});

	if (!clientId) {
		return (
			<div className="container mx-auto p-6">
				<p>Client ID is required</p>
			</div>
		);
	}

	const validateFields = (data: { key?: string; value: string }) => {
		const errors: FormError = {};

		if ('key' in data && !data.key?.trim()) {
			errors.key = 'Name is required';
		}
		if (!data.value?.trim()) {
			errors.value = 'Value is required';
		}

		return errors;
	};

	const handleEdit = (
		placeholder: NonNullable<typeof selectedPlaceholder>,
	) => {
		setSelectedPlaceholder(placeholder);
		setEditError({});
		setIsEditDialogOpen(true);
	};

	const handleCreate = () => {
		setNewPlaceholder({ key: '', value: '' });
		setCreateError({});
		setIsCreateDialogOpen(true);
	};

	const handleSave = async (
		placeholder: NonNullable<typeof selectedPlaceholder>,
	) => {
		const errors = validateFields({ value: placeholder.value });
		if (Object.keys(errors).length > 0) {
			setEditError(errors);
			return;
		}

		try {
			if (placeholder.id.startsWith('default-')) {
				await createPlaceholder({
					key: placeholder.key,
					value: placeholder.value,
					type: promptType,
					clientId: clientId,
				});
			} else {
				await updatePlaceholder({
					id: placeholder.id,
					value: placeholder.value,
				});
			}
			setIsEditDialogOpen(false);
		} catch (err) {
			setEditError({
				submit:
					err instanceof Error
						? err.message
						: 'Failed to save changes',
			});
		}
	};

	const handleCreateSave = async () => {
		const errors = validateFields(newPlaceholder);
		if (Object.keys(errors).length > 0) {
			setCreateError(errors);
			return;
		}

		try {
			await createPlaceholder({
				key: newPlaceholder.key,
				value: newPlaceholder.value,
				type: promptType,
				clientId: clientId,
			});
			setIsCreateDialogOpen(false);
			setNewPlaceholder({ key: '', value: '' });
		} catch (err) {
			setCreateError({
				submit:
					err instanceof Error
						? err.message
						: 'Failed to create placeholder',
			});
		}
	};

	const handleDeleteClick = (
		placeholder: Placeholder | DefaultPlaceholder,
	) => {
		if (placeholder.id.startsWith('default-')) {
			return; // Don't allow deleting default placeholders
		}
		setSelectedPlaceholder(placeholder);
		setDeleteError('');
		setIsDeleteDialogOpen(true);
	};

	const handleDelete = async () => {
		if (
			!selectedPlaceholder ||
			selectedPlaceholder.id.startsWith('default-')
		) {
			return;
		}

		try {
			await deletePlaceholder(selectedPlaceholder.id);
			setIsDeleteDialogOpen(false);
			setSelectedPlaceholder(null);
		} catch (err) {
			setDeleteError(
				err instanceof Error
					? err.message
					: 'Failed to delete placeholder',
			);
		}
	};

	if (isLoading) {
		return (
			<div className="container mx-auto p-6">
				<p>Loading placeholders...</p>
			</div>
		);
	}

	return (
		<div className="container mx-auto p-6">
			<div className="mb-6">
				<h1 className="text-2xl font-bold mb-4">Prompt Placeholders</h1>
				<p className="text-gray-600 mb-6">
					Edit placeholders of {promptType} prompt for {clientId}.
				</p>
			</div>

			<div className="space-y-6">
				<div className="flex justify-end">
					<Button onClick={handleCreate}>
						<Plus className="h-4 w-4 mr-2" />
						Add New Placeholder
					</Button>
				</div>

				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Value</TableHead>
							<TableHead>Source</TableHead>
							<TableHead className="w-[100px]">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{placeholders?.map((placeholder) => (
							<TableRow key={placeholder.id}>
								<TableCell>{placeholder.key}</TableCell>
								<TableCell className="max-w-md truncate">
									{placeholder.value}
								</TableCell>
								<TableCell>
									{placeholder.id.startsWith('default-')
										? 'Default'
										: 'Custom'}
								</TableCell>
								<TableCell>
									<div className="flex items-center gap-2">
										<Button
											size="icon"
											variant="outline"
											onClick={() =>
												handleEdit(placeholder)
											}
										>
											<Edit className="h-4 w-4" />
										</Button>
										{!placeholder.id.startsWith(
											'default-',
										) && (
											<Button
												size="icon"
												variant="outline"
												onClick={() =>
													handleDeleteClick(
														placeholder,
													)
												}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										)}
									</div>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>

				{/* Edit Dialog */}
				<Dialog
					open={isEditDialogOpen}
					onOpenChange={setIsEditDialogOpen}
				>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Edit Placeholder</DialogTitle>
						</DialogHeader>
						<div className="space-y-4 py-4">
							<div className="space-y-2">
								<Label>Name</Label>
								<p className="text-sm text-gray-500">
									{selectedPlaceholder?.key}
								</p>
							</div>
							<div className="space-y-2">
								<Label htmlFor="value">Value</Label>
								<Textarea
									id="value"
									rows={3}
									defaultValue={selectedPlaceholder?.value}
									onChange={(e) => {
										if (selectedPlaceholder) {
											setSelectedPlaceholder({
												...selectedPlaceholder,
												value: e.target.value,
											});
										}
									}}
								/>
								{editError.value && (
									<p className="text-sm text-red-500">
										{editError.value}
									</p>
								)}
							</div>
							{editError.submit && (
								<p className="text-sm text-red-500">
									{editError.submit}
								</p>
							)}
							<div className="flex justify-end space-x-2">
								<Button
									variant="outline"
									onClick={() => setIsEditDialogOpen(false)}
								>
									Cancel
								</Button>
								<Button
									onClick={() =>
										selectedPlaceholder &&
										handleSave(selectedPlaceholder)
									}
								>
									Save Changes
								</Button>
							</div>
						</div>
					</DialogContent>
				</Dialog>

				{/* Create Dialog */}
				<Dialog
					open={isCreateDialogOpen}
					onOpenChange={setIsCreateDialogOpen}
				>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Create New Placeholder</DialogTitle>
						</DialogHeader>
						<div className="space-y-4 py-4">
							<div className="space-y-2">
								<Label htmlFor="key">Name</Label>
								<Input
									id="key"
									value={newPlaceholder.key}
									onChange={(e) =>
										setNewPlaceholder((prev) => ({
											...prev,
											key: e.target.value,
										}))
									}
									placeholder="Enter placeholder name"
								/>
								{createError.key && (
									<p className="text-sm text-red-500">
										{createError.key}
									</p>
								)}
							</div>
							<div className="space-y-2">
								<Label htmlFor="newValue">Value</Label>
								<Textarea
									id="newValue"
									rows={3}
									value={newPlaceholder.value}
									onChange={(e) =>
										setNewPlaceholder((prev) => ({
											...prev,
											value: e.target.value,
										}))
									}
									placeholder="Enter placeholder value"
								/>
								{createError.value && (
									<p className="text-sm text-red-500">
										{createError.value}
									</p>
								)}
							</div>
							{createError.submit && (
								<p className="text-sm text-red-500">
									{createError.submit}
								</p>
							)}
							<div className="flex justify-end space-x-2">
								<Button
									variant="outline"
									onClick={() => {
										setIsCreateDialogOpen(false);
										setNewPlaceholder({
											key: '',
											value: '',
										});
										setCreateError({});
									}}
								>
									Cancel
								</Button>
								<Button onClick={handleCreateSave}>
									Create
								</Button>
							</div>
						</div>
					</DialogContent>
				</Dialog>

				{/* Delete Confirmation Dialog */}
				<Dialog
					open={isDeleteDialogOpen}
					onOpenChange={setIsDeleteDialogOpen}
				>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Delete Placeholder</DialogTitle>
							<DialogDescription>
								Are you sure you want to delete the placeholder
								&quot;{selectedPlaceholder?.key}&quot;? This
								action cannot be undone.
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-4 py-4">
							{deleteError && (
								<p className="text-sm text-red-500">
									{deleteError}
								</p>
							)}
							<div className="flex justify-end space-x-2">
								<Button
									variant="outline"
									onClick={() => {
										setIsDeleteDialogOpen(false);
										setSelectedPlaceholder(null);
										setDeleteError('');
									}}
								>
									Cancel
								</Button>
								<Button
									variant="destructive"
									onClick={handleDelete}
								>
									Delete
								</Button>
							</div>
						</div>
					</DialogContent>
				</Dialog>
			</div>
		</div>
	);
}

export default function PromptPlaceholdersPage() {
	return (
		<QueryClientProvider client={queryClient}>
			<Suspense
				fallback={
					<div className="container mx-auto p-6">Loading...</div>
				}
			>
				<PlaceholdersContent />
			</Suspense>
		</QueryClientProvider>
	);
}
