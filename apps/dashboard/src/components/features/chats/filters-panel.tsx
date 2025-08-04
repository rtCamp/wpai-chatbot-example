'use client';

import { Button } from '@wpai-chatbot/dashboard/components/ui/button';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@wpai-chatbot/dashboard/components/ui/select';

interface FilterPanelProps {
	typeFilter: string;
	setTypeFilter: (value: string) => void;
	statusFilter: string;
	setStatusFilter: (value: string) => void;
	onApplyFilters: () => void;
	onReset: () => void;
}

export function FilterPanel({
	typeFilter,
	setTypeFilter,
	statusFilter,
	setStatusFilter,
	onApplyFilters,
	onReset,
}: FilterPanelProps) {
	return (
		<div className="flex flex-col md:flex-row gap-4 p-4 bg-slate-50 rounded-lg">
			<div className="flex-1 space-y-2">
				<label className="text-xs">Type</label>
				<Select value={typeFilter} onValueChange={setTypeFilter}>
					<SelectTrigger>
						<SelectValue placeholder="Select Type" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All</SelectItem>
						<SelectItem value="retrieval">Retrieval</SelectItem>
						<SelectItem value="chat">Chat</SelectItem>
						<SelectItem value="blocked">Blocked</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className="flex-1 space-y-2">
				<label className="text-xs">Status</label>
				<Select value={statusFilter} onValueChange={setStatusFilter}>
					<SelectTrigger>
						<SelectValue placeholder="Select Status" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All</SelectItem>
						<SelectItem value="completed">Completed</SelectItem>
						<SelectItem value="pending">Pending</SelectItem>
						<SelectItem value="failed">Failed</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className="flex items-end space-x-2">
				<Button onClick={onApplyFilters}>Apply Filters</Button>
				<Button variant="outline" onClick={onReset}>
					Reset
				</Button>
			</div>
		</div>
	);
}
