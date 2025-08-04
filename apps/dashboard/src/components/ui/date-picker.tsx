'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@wpai-chatbot/dashboard/lib/utils';
import { Button } from '@wpai-chatbot/dashboard/components/ui/button';
import { Calendar } from '@wpai-chatbot/dashboard/components/ui/calendar';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@wpai-chatbot/dashboard/components/ui/popover';

interface DatePickerProps {
	date?: Date | undefined;
	onSelect: (date: Date | undefined) => void;
}

export function DatePicker({ date, onSelect }: DatePickerProps) {
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					variant={'outline'}
					className={cn(
						'w-full justify-start text-left font-normal',
						!date && 'text-muted-foreground',
					)}
				>
					<CalendarIcon className="mr-2 h-4 w-4" />
					{date ? format(date, 'PPP') : <span>Pick a date</span>}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0">
				<Calendar
					mode="single"
					selected={date || undefined}
					onSelect={onSelect}
					initialFocus
				/>
			</PopoverContent>
		</Popover>
	);
}
