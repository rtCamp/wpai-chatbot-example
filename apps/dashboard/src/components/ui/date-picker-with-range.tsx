'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { cn } from '@wpai-chatbot/dashboard/lib/utils';
import { Button } from '@wpai-chatbot/dashboard/components/ui/button';
import { Calendar } from '@wpai-chatbot/dashboard/components/ui/calendar';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@wpai-chatbot/dashboard/components/ui/popover';

interface DatePickerWithRangeProps
	extends React.HTMLAttributes<HTMLDivElement> {
	dateRange: DateRange | undefined;
	setDateRange: (dateRange: DateRange | undefined) => void;
}

export function DatePickerWithRange({
	className,
	dateRange,
	setDateRange,
}: DatePickerWithRangeProps) {
	return (
		<div className={cn('grid gap-2', className)}>
			<Popover>
				<PopoverTrigger asChild>
					<Button
						id="date"
						variant={'outline'}
						className={cn(
							'w-[300px] justify-start text-left font-normal',
							!dateRange && 'text-muted-foreground',
						)}
					>
						<CalendarIcon className="mr-2 h-4 w-4" />
						{dateRange?.from ? (
							dateRange.to ? (
								<>
									{format(dateRange.from, 'MMM dd, yyyy')} -{' '}
									{format(dateRange.to, 'MMM dd, yyyy')}
								</>
							) : (
								format(dateRange.from, 'MMM dd, yyyy')
							)
						) : (
							<span>Select date range</span>
						)}
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-auto p-0" align="start">
					<Calendar
						initialFocus
						mode="range"
						defaultMonth={dateRange?.from || new Date()}
						selected={dateRange}
						onSelect={setDateRange}
						numberOfMonths={2}
					/>
				</PopoverContent>
			</Popover>
		</div>
	);
}
