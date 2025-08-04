'use client';

import { ExternalLink } from 'lucide-react';
import { Button } from '@wpai-chatbot/dashboard/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@wpai-chatbot/dashboard/components/ui/dialog';

interface AnswerDialogProps {
	summary?: string;
}

export function AnswerDialog({ summary }: AnswerDialogProps) {
	if (!summary) {
		return <span className="text-slate-400">No answer</span>;
	}

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className="flex items-center gap-1"
				>
					View <ExternalLink className="h-3 w-3" />
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
				<DialogHeader>
					<DialogTitle>Answer</DialogTitle>
				</DialogHeader>
				<div
					className="prose prose-sm max-w-none"
					dangerouslySetInnerHTML={{ __html: summary }}
				/>
			</DialogContent>
		</Dialog>
	);
}
