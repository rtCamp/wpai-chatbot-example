'use client';

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@wpai-chatbot/dashboard/components/ui/select';

interface TableFooterProps {
	page: number;
	limit: number;
	totalItems: number;
	setLimit: (limit: number) => void;
	setPage: (page: number) => void;
}

export function TablePaginationInfo({
	page,
	limit,
	totalItems,
	setLimit,
	setPage,
}: TableFooterProps) {
	return (
		<div className="flex justify-between items-center">
			<div className="text-sm text-muted-foreground">
				Showing {(page - 1) * limit + 1}-
				{Math.min(page * limit, totalItems)} of {totalItems} chats
			</div>

			<Select
				value={limit.toString()}
				onValueChange={(value) => {
					setLimit(Number(value));
					setPage(1);
				}}
			>
				<SelectTrigger className="w-[100px]">
					<SelectValue placeholder="Rows per page" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="10">10 rows</SelectItem>
					<SelectItem value="20">20 rows</SelectItem>
					<SelectItem value="50">50 rows</SelectItem>
					<SelectItem value="100">100 rows</SelectItem>
				</SelectContent>
			</Select>
		</div>
	);
}
