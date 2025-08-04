'use client';

import { useState } from 'react';
import { Edit } from 'lucide-react';
import { useSystemPrompts } from '@wpai-chatbot/dashboard/hooks/use-system-prompts';
import { SystemPrompt } from '@wpai-chatbot/dashboard/interfaces/system-prompt';
import { Button } from '@wpai-chatbot/dashboard/components/ui/button';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@wpai-chatbot/dashboard/components/ui/table';

import { EditPromptDialog } from './edit-prompt-dialog';

export function PromptsTable() {
	const { prompts, isLoading, updatePrompt, createPrompt } =
		useSystemPrompts();
	const [selectedPrompt, setSelectedPrompt] = useState<SystemPrompt | null>(
		null,
	);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

	const handleEdit = (prompt: SystemPrompt) => {
		setSelectedPrompt(prompt);
		setIsEditDialogOpen(true);
	};

	const handleCreate = () => {
		setSelectedPrompt(null);
		setIsCreateDialogOpen(true);
	};

	const handleSave = async (values: SystemPrompt) => {
		try {
			if (values.isDefault) {
				await createPrompt(values);
			} else {
				await updatePrompt(values);
			}
			setIsEditDialogOpen(false);
		} catch (err) {
			alert(err);
			// Keep the dialog open when there's an error
			setIsEditDialogOpen(true);
		}
	};

	const handleCreateSave = async (values: SystemPrompt) => {
		try {
			await createPrompt(values);
			setIsCreateDialogOpen(false);
		} catch (err) {
			alert(err);
			// Keep the dialog open when there's an error
			setIsCreateDialogOpen(true);
		}
	};

	const truncateText = (text: string) => {
		return text.length > 100 ? `${text.slice(0, 100)}...` : text;
	};

	if (isLoading) {
		return <div>Loading...</div>;
	}

	return (
		<div className="space-y-4">
			<div className="flex justify-between">
				<h2 className="text-lg font-semibold">System Prompts</h2>
				<Button onClick={handleCreate}>Create New Prompt</Button>
			</div>

			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Client ID</TableHead>
						<TableHead>Type</TableHead>
						<TableHead>Prompt</TableHead>
						<TableHead>Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{prompts?.map((prompt) => (
						<TableRow key={prompt.id}>
							<TableCell>{prompt.clientId}</TableCell>
							<TableCell>{prompt.type}</TableCell>
							<TableCell>{truncateText(prompt.prompt)}</TableCell>
							<TableCell>
								<div className="flex gap-2">
									<Button
										size="icon"
										variant="outline"
										onClick={() => handleEdit(prompt)}
									>
										<Edit className="h-4 w-4" />
									</Button>
								</div>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>

			<EditPromptDialog
				open={isEditDialogOpen}
				onOpenChange={setIsEditDialogOpen}
				prompt={selectedPrompt}
				onSave={handleSave}
			/>

			<EditPromptDialog
				open={isCreateDialogOpen}
				onOpenChange={setIsCreateDialogOpen}
				prompt={null}
				onSave={handleCreateSave}
			/>
		</div>
	);
}
