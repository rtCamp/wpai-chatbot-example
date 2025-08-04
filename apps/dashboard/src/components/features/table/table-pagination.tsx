'use client';

import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from '@wpai-chatbot/dashboard/components/ui/pagination';

interface TablePaginationProps {
	page: number;
	maxPages: number;
	setPage: (page: number) => void;
}

export function TablePagination({
	page,
	maxPages,
	setPage,
}: TablePaginationProps) {
	return (
		<Pagination>
			<PaginationContent>
				<PaginationItem>
					<PaginationPrevious
						href="#"
						onClick={(e) => {
							e.preventDefault();
							setPage(Math.max(1, page - 1));
						}}
						className={
							page <= 1 ? 'pointer-events-none opacity-50' : ''
						}
					/>
				</PaginationItem>

				{Array.from({ length: Math.min(5, maxPages) }, (_, i) => {
					// Logic to show the correct page numbers around the current page
					let pageNum;
					if (maxPages <= 5) {
						pageNum = i + 1;
					} else if (page <= 3) {
						pageNum = i + 1;
					} else if (page >= maxPages - 2) {
						pageNum = maxPages - 4 + i;
					} else {
						pageNum = page - 2 + i;
					}

					return (
						<PaginationItem key={pageNum}>
							<PaginationLink
								href="#"
								isActive={pageNum === page}
								onClick={(e) => {
									e.preventDefault();
									setPage(pageNum);
								}}
							>
								{pageNum}
							</PaginationLink>
						</PaginationItem>
					);
				})}

				<PaginationItem>
					<PaginationNext
						href="#"
						onClick={(e) => {
							e.preventDefault();
							setPage(Math.min(maxPages, page + 1));
						}}
						className={
							page >= maxPages
								? 'pointer-events-none opacity-50'
								: ''
						}
					/>
				</PaginationItem>
			</PaginationContent>
		</Pagination>
	);
}
