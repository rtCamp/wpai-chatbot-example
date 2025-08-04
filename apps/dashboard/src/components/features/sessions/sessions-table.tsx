'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Loader2, ArrowRight } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@wpai-chatbot/dashboard/components/ui/table';
import { Button } from '@wpai-chatbot/dashboard/components/ui/button';
import { useSessions } from '@wpai-chatbot/dashboard/hooks/use-sessions';

import { TablePagination, TablePaginationInfo } from '../table';

import { SessionsFilter } from './sessions-filter';

export function SessionsTable() {
	const router = useRouter();
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(10);
	const [emailFilter, setEmailFilter] = useState('');
	const [dateRange, setDateRange] = useState<DateRange | undefined>(
		undefined,
	);
	const [showEmptyChats, setShowEmptyChats] = useState(false);

	const { data, isLoading, isError } = useSessions({
		page,
		limit,
		email: emailFilter || undefined,
		startDate: dateRange?.from ? dateRange.from.toISOString() : undefined,
		endDate: dateRange?.to ? dateRange.to.toISOString() : undefined,
		includeEmpty: showEmptyChats,
	});

	const handleApplyFilters = (filters: {
		email: string;
		dateRange: DateRange | undefined;
		showEmptyChats: boolean;
	}) => {
		setEmailFilter(filters.email);
		setDateRange(filters.dateRange);
		setShowEmptyChats(filters.showEmptyChats);
		setPage(1);
	};

	const handleReset = () => {
		setEmailFilter('');
		setDateRange(undefined);
		setShowEmptyChats(false);
		setPage(1);
	};

	if (isLoading) {
		return (
			<div className="flex justify-center p-8">
				<Loader2 className="animate-spin" />
			</div>
		);
	}

	if (isError) {
		return (
			<div className="flex justify-center p-8 text-muted-foreground my-auto mx-auto">
				Error loading chats. Please try again.
			</div>
		);
	}

	const maxPages = data?.meta.pages || 1;

	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				<h1 className="text-xl font-bold mb-4">Chats</h1>
				<SessionsFilter
					onApplyFilters={handleApplyFilters}
					onReset={handleReset}
					initialFilters={{
						email: emailFilter,
						dateRange: dateRange,
						showEmptyChats: showEmptyChats,
					}}
				/>
			</div>

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>User Email</TableHead>
							<TableHead>Message</TableHead>
							<TableHead>Started At</TableHead>
							<TableHead>Total Messages</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{data?.data.length ? (
							data.data.map((session) => {
								const messageCount = session.messageCount || 0;
								const firstMessage =
									session.messages &&
									session.messages.length > 0
										? session.messages[0]
										: null;

								return (
									<TableRow key={session.id}>
										<TableCell>
											<Link
												href={`/users/${encodeURIComponent(session.user?.email || '')}`}
												className="text-blue-600 hover:underline"
											>
												{session.user?.email || 'N/A'}
											</Link>
										</TableCell>
										<TableCell className="max-w-[300px] break-words whitespace-normal">
											{firstMessage ? (
												<div className="text-sm truncate">
													{firstMessage.query ??
														'N/A'}
												</div>
											) : (
												<span className="text-gray-500">
													No messages
												</span>
											)}
										</TableCell>
										<TableCell>
											{format(
												new Date(session.createdAt),
												'MMM dd, yyyy HH:mm',
											)}
										</TableCell>
										<TableCell>{messageCount}</TableCell>
										<TableCell>
											<Button
												variant="ghost"
												size="sm"
												className="cursor-pointer"
												onClick={() =>
													router.push(
														`chats/${session.id}`,
													)
												}
											>
												View Chat
												<ArrowRight />
											</Button>
										</TableCell>
									</TableRow>
								);
							})
						) : (
							<TableRow>
								<TableCell
									colSpan={6}
									className="h-24 text-center text-muted-foreground"
								>
									No sessions found
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			<TablePagination
				page={page}
				maxPages={maxPages}
				setPage={setPage}
			/>

			<TablePaginationInfo
				page={page}
				limit={limit}
				totalItems={data?.meta.total || 0}
				setLimit={setLimit}
				setPage={setPage}
			/>
		</div>
	);
}
