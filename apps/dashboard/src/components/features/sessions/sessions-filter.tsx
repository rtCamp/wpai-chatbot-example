'use client';

import { DateRange } from 'react-day-picker';
import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Switch } from '@wpai-chatbot/dashboard/components/ui/switch';
import { DatePickerWithRange } from '@wpai-chatbot/dashboard/components/ui/date-picker-with-range';
import { Input } from '@wpai-chatbot/dashboard/components/ui/input';
import { Button } from '@wpai-chatbot/dashboard/components/ui/button';
import { Label } from '@wpai-chatbot/dashboard/components/ui/label';

import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';

interface SessionsFilterProps {
	onApplyFilters: (filters: {
		email: string;
		dateRange: DateRange | undefined;
		showEmptyChats: boolean;
	}) => void;
	onReset: () => void;
	initialFilters?: {
		email?: string;
		dateRange?: DateRange;
		showEmptyChats?: boolean;
	};
}

export const SessionsFilter = ({
	onApplyFilters,
	onReset,
	initialFilters = {},
}: SessionsFilterProps) => {
	const [searchEmail, setSearchEmail] = useState(initialFilters.email || '');
	const [dateRange, setDateRange] = useState<DateRange | undefined>(
		initialFilters.dateRange,
	);
	const [showEmptyChats, setShowEmptyChats] = useState(
		initialFilters.showEmptyChats || false,
	);

	const handleApplyFilters = () => {
		onApplyFilters({
			email: searchEmail,
			dateRange,
			showEmptyChats,
		});
	};

	const handleReset = () => {
		setSearchEmail('');
		setDateRange(undefined);
		setShowEmptyChats(false);
		onReset();
	};

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button className="cursor-pointer" variant="outline">
					Filters
				</Button>
			</PopoverTrigger>
			<PopoverContent className="flex flex-col gap-5 w-full">
				<div className="flex items-center space-x-2">
					<div className="flex-1 space-y-1">
						<Label
							className="text-sm font-medium"
							htmlFor="email-filter"
						>
							User Email
						</Label>
						<Input
							id="email-filter"
							placeholder="Filter by email"
							value={searchEmail}
							autoComplete="off"
							autoCorrect="off"
							onChange={(e) => setSearchEmail(e.target.value)}
							className="h-9"
						/>
					</div>
				</div>

				<div className="space-y-1">
					<Label className="text-sm font-medium">Date Range</Label>
					<DatePickerWithRange
						dateRange={dateRange}
						setDateRange={setDateRange}
					/>
				</div>

				<div className="flex items-center space-x-2">
					<Switch
						id="empty-chats"
						checked={showEmptyChats}
						onCheckedChange={setShowEmptyChats}
					/>
					<Label
						htmlFor="empty-chats"
						className="text-sm font-medium"
					>
						Show Empty Chats
					</Label>
				</div>

				<div className="flex space-x-2 mt-4">
					<Button onClick={handleApplyFilters} size="sm">
						<Search className="h-4 w-4 mr-1" />
						Apply Filters
					</Button>
					<Button onClick={handleReset} variant="outline" size="sm">
						<X className="h-4 w-4 mr-1" />
						Reset
					</Button>
				</div>
			</PopoverContent>
		</Popover>
	);
};
