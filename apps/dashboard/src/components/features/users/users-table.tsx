'use client';

import { format } from 'date-fns';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useUsers } from '@wpai-chatbot/dashboard/hooks/use-users';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@wpai-chatbot/dashboard/components/ui/table';

import { TablePagination, TablePaginationInfo } from '../table';

export function UsersTable() {
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(10);

	const { data, isLoading, isError } = useUsers({ page, limit });

	const formatDate = (timestamp: number) => {
		return format(new Date(timestamp), 'MMM dd, yyyy HH:mm');
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
			<div className="flex justify-center p-8 text-red-500">
				Error loading users. Please try again.
			</div>
		);
	}

	const maxPages = Math.ceil((data?.meta.total || 0) / limit);

	return (
		<div className="space-y-4">
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead className="max-w-[300px]">
								Email
							</TableHead>
							<TableHead>Created At</TableHead>
							<TableHead>Last Login</TableHead>
							<TableHead>Status</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{data?.data.length ? (
							data.data.map((user) => (
								<TableRow key={user.id}>
									<TableCell>
										<div className="flex items-center gap-2">
											{user.avatar ? (
												<div className="h-10 w-10 rounded-full overflow-hidden">
													<Image
														src={user.avatar}
														alt={
															user.name ||
															'User avatar'
														}
														className="object-cover w-full h-full"
														height={32}
														width={32}
													/>
												</div>
											) : (
												<div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
													{user.name?.charAt(0) ||
														'U'}
												</div>
											)}
											{user.name || 'N/A'}
										</div>
									</TableCell>
									<TableCell className="max-w-[300px] break-words whitespace-normal">
										{user.primaryEmail}
									</TableCell>
									<TableCell>
										{formatDate(user.createdAt)}
									</TableCell>
									<TableCell>
										{user.lastSignInAt
											? formatDate(user.lastSignInAt)
											: 'Never'}
									</TableCell>
									<TableCell>
										<span
											className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${!user.isSuspended ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
										>
											{!user.isSuspended
												? 'Active'
												: 'Suspended'}
										</span>
									</TableCell>
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={6}
									className="h-24 text-center text-muted-foreground"
								>
									No users found
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
