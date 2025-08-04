import { useState, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';
import { Button } from '@wpai-chatbot/dashboard/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@wpai-chatbot/dashboard/components/ui/dialog';
import { Input } from '@wpai-chatbot/dashboard/components/ui/input';
import { Label } from '@wpai-chatbot/dashboard/components/ui/label';
import { Textarea } from '@wpai-chatbot/dashboard/components/ui/textarea';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@wpai-chatbot/dashboard/components/ui/select';
import {
	SystemPrompt,
	PromptType,
} from '@wpai-chatbot/dashboard/interfaces/system-prompt';
import { useSystemPrompts } from '@wpai-chatbot/dashboard/hooks/use-system-prompts';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@wpai-chatbot/dashboard/components/ui/tooltip';
import { cn } from '@wpai-chatbot/dashboard/lib/utils';

interface EditPromptDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	prompt: SystemPrompt | null;
	onSave: (values: SystemPrompt) => void;
}

export function EditPromptDialog({
	open,
	onOpenChange,
	prompt,
	onSave,
}: EditPromptDialogProps) {
	const { fetchDefaultPrompts } = useSystemPrompts();
	const [values, setValues] = useState<SystemPrompt>({
		id: '',
		prompt: '',
		clientId: '',
		type: PromptType.system,
	});
	const [isFetching, setIsFetching] = useState(false);
	const [errors, setErrors] = useState<{
		prompt?: string;
		clientId?: string;
	}>({});

	useEffect(() => {
		if (open) {
			// Reset errors when dialog opens
			setErrors({});
			// If prompt is provided, it means we are editing an existing prompt
			if (prompt) {
				setValues(prompt);
			} else {
				// Reset form for create
				setValues({
					id: '',
					prompt: '',
					clientId: '',
					type: PromptType.system,
				});
			}
		}
	}, [prompt, open]);

	const validateForm = () => {
		const newErrors: { prompt?: string; clientId?: string } = {};

		if (!values.prompt.trim()) {
			newErrors.prompt = 'Prompt cannot be empty';
		}
		if (!values.clientId.trim()) {
			newErrors.clientId = 'Client ID cannot be empty';
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSave = () => {
		if (validateForm()) {
			onSave(values);
			onOpenChange(false);
		}
	};

	const handleFetchDefaultPrompt = async () => {
		try {
			setIsFetching(true);
			const defaultPrompts = await fetchDefaultPrompts();
			const defaultPrompt = defaultPrompts[values.type];
			if (defaultPrompt) {
				setValues((prev) => ({ ...prev, prompt: defaultPrompt }));
				// Clear prompt error if it exists since we now have content
				setErrors((prev) => ({ ...prev, prompt: undefined }));
			}
		} catch (error) {
			console.error('Error fetching default prompt:', error);
		} finally {
			setIsFetching(false);
		}
	};

	const getPromptTypeDescription = (type: PromptType) => {
		switch (type) {
			case PromptType.system:
				return "System prompts define the AI's core behavior, personality, and constraints when interacting with users.";
			case PromptType.inference:
				return 'Inference prompts help the AI to classify the query and determine the appropriate type of query. for e.g. action, page_aware_query or blocked.';
			case PromptType.queryProcessor:
				return 'Query processor prompts help format and optimize queries for retrieving relevant information from the knowledge base.';
			default:
				return 'Select a prompt type';
		}
	};

	const getPromptTypeName = (type: PromptType) => {
		switch (type) {
			case PromptType.system:
				return 'System';
			case PromptType.inference:
				return 'Inference';
			case PromptType.queryProcessor:
				return 'Query Processor';
			default:
				return 'Select a prompt type';
		}
	};

	return (
		<>
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent className="sm:max-w-[80vw]">
					<DialogHeader>
						<DialogTitle>
							{prompt ? 'Edit Prompt' : 'Create New Prompt'}
						</DialogTitle>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="grid gap-2">
							<div className="flex items-center gap-2">
								<Label htmlFor="prompt">
									Edit {getPromptTypeName(values.type)} Prompt
									*
								</Label>
								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger asChild>
											<HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help" />
										</TooltipTrigger>
										<TooltipContent className="max-w-[300px] text-sm">
											{getPromptTypeDescription(
												values.type,
											)}
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							</div>
							<Textarea
								id="prompt"
								value={values.prompt}
								onChange={(e) => {
									setValues((prev) => ({
										...prev,
										prompt: e.target.value,
									}));
									if (e.target.value.trim()) {
										setErrors((prev) => ({
											...prev,
											prompt: undefined,
										}));
									}
								}}
								onBlur={(e) => {
									const trimmedValue = e.target.value.trim();
									setValues((prev) => ({
										...prev,
										prompt: trimmedValue,
									}));
									if (!trimmedValue) {
										setErrors((prev) => ({
											...prev,
											prompt: 'Prompt cannot be empty',
										}));
									}
								}}
								className={cn(
									'min-h-[100px] max-h-[300px]',
									errors.prompt &&
										'border-destructive focus-visible:ring-destructive',
								)}
								placeholder="Enter your prompt here"
							/>
							{errors.prompt && (
								<p className="text-sm text-destructive">
									{errors.prompt}
								</p>
							)}
						</div>
						<div className="grid gap-2">
							<Label htmlFor="clientId">Client ID *</Label>
							<Input
								id="clientId"
								value={values.clientId}
								onChange={(e) => {
									setValues((prev) => ({
										...prev,
										clientId: e.target.value,
									}));
									if (e.target.value.trim()) {
										setErrors((prev) => ({
											...prev,
											clientId: undefined,
										}));
									}
								}}
								onBlur={(e) => {
									const trimmedValue = e.target.value.trim();
									setValues((prev) => ({
										...prev,
										clientId: trimmedValue,
									}));
									if (!trimmedValue) {
										setErrors((prev) => ({
											...prev,
											clientId:
												'Client ID cannot be empty',
										}));
									}
								}}
								className={cn(
									errors.clientId &&
										'border-destructive focus-visible:ring-destructive',
								)}
							/>
							{errors.clientId && (
								<p className="text-sm text-destructive">
									{errors.clientId}
								</p>
							)}
						</div>
						<div className="grid gap-2">
							<Label htmlFor="type">Type *</Label>
							<Select
								value={values.type}
								onValueChange={(value: PromptType) =>
									setValues((prev) => ({
										...prev,
										type: value,
									}))
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select type" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value={PromptType.system}>
										System
									</SelectItem>
									<SelectItem value={PromptType.inference}>
										Inference
									</SelectItem>
									<SelectItem
										value={PromptType.queryProcessor}
									>
										Query Processor
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
					<DialogFooter className="flex gap-2">
						<Button
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button
							variant="secondary"
							onClick={handleFetchDefaultPrompt}
							disabled={isFetching}
						>
							{isFetching
								? 'Fetching...'
								: 'Fetch Default Prompt'}
						</Button>
						<Button
							onClick={handleSave}
							disabled={
								!values.prompt.trim() || !values.clientId.trim()
							}
						>
							Save
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
