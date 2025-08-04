'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Loader2, Info } from 'lucide-react';
import { useSessionMessages } from '@wpai-chatbot/dashboard/hooks/use-messages';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@wpai-chatbot/dashboard/components/ui/table';
import {
	Tabs,
	TabsList,
	TabsTrigger,
	TabsContent,
} from '@wpai-chatbot/dashboard/components/ui/tabs';
import { Button } from '@wpai-chatbot/dashboard/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@wpai-chatbot/dashboard/components/ui/dialog';

import { TablePagination, TablePaginationInfo } from '../table';

import { AnswerDialog } from './answer-dialog';
import { RetrievalDialog } from './retrieval-dialog';
import { StatusBadge } from './status-badge';

export function ChatsTable({ id }: { id: string }) {
	const [viewMode, setViewMode] = useState<'table' | 'chat'>('table');
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(10);

	type Chat = {
		id: string;
		query: string;
		pageUrl: string;
		createdAt: string;
		type: string;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		retrieval_result: any;
		summary: string;
	};

	const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
	const [showMetadata, setShowMetadata] = useState(false);

	const { data, isLoading, isError } = useSessionMessages(id, {
		page,
		limit,
	});

	const {
		data: chatData,
		isLoading: chatLoading,
		isError: chatError,
	} = useSessionMessages(id, {
		page: 1,
		limit: 1000,
	});

	const openMetadata = (chat: Chat) => {
		setSelectedChat(chat);
		setShowMetadata(true);
	};

	const truncate = (str?: string, length = 100) => {
		if (!str) return '';
		return str.length > length ? str.substring(0, length) + '...' : str;
	};

	const maxPages = data?.meta.pages || 1;
	const user = data?.user;

	return (
		<div className="space-y-4">
			<div className="flex flex-col text-sm">
				<span>User: {user?.email}</span>
				<span>
					Session ID: <code>{id}</code>
				</span>
			</div>
			<div>
				<Tabs
					value={viewMode}
					onValueChange={(value) =>
						setViewMode(value as 'table' | 'chat')
					}
				>
					<TabsList>
						<TabsTrigger value="table">Table View</TabsTrigger>
						<TabsTrigger value="chat">
							Conversation View
						</TabsTrigger>
					</TabsList>

					<TabsContent value="table">
						{isLoading ? (
							<div className="flex justify-center p-8">
								<Loader2 className="animate-spin" />
							</div>
						) : isError ? (
							<div className="flex justify-center p-8 text-red-500">
								Error loading chats. Please try again.
							</div>
						) : (
							<>
								<div className="rounded-md border">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead className="max-w-[300px] min-w-[180px]">
													Query
												</TableHead>
												<TableHead className="max-w-[300px]">
													Page Url
												</TableHead>
												<TableHead className="w-[180px]">
													Date
												</TableHead>
												<TableHead>Type</TableHead>
												<TableHead className="max-w-[300px]">
													Retrieval Result
												</TableHead>
												<TableHead className="max-w-[300px]">
													Answer
												</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{data?.data.length ? (
												data.data.map((chat) => (
													<TableRow
														key={chat.id}
														className="cursor-pointer"
													>
														<TableCell className="max-w-[300px] break-words whitespace-normal">
															{truncate(
																chat.query,
															)}
														</TableCell>
														<TableCell className="max-w-[300px] break-words whitespace-normal">
															<a
																href={
																	chat.pageUrl
																}
																target="_blank"
																rel="noopener noreferrer"
																className="text-blue-500 underline"
															>
																{truncate(
																	chat.pageUrl,
																)}
															</a>
														</TableCell>
														<TableCell>
															{format(
																new Date(
																	chat.createdAt,
																),
																'MMM dd, yyyy HH:mm',
															)}
														</TableCell>
														<TableCell>
															<StatusBadge
																status={
																	chat.type
																}
															/>
														</TableCell>
														<TableCell className="max-w-[300px] break-words">
															<RetrievalDialog
																retrievalResult={
																	chat.retrieval_result
																}
															/>
														</TableCell>
														<TableCell className="max-w-[300px] break-words">
															<AnswerDialog
																summary={
																	chat.summary
																}
															/>
														</TableCell>
													</TableRow>
												))
											) : (
												<TableRow>
													<TableCell
														colSpan={6}
														className="h-24 text-center text-muted-foreground"
													>
														No chats found
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
							</>
						)}
					</TabsContent>

					<TabsContent value="chat">
						{chatLoading || chatError ? (
							<div className="flex justify-center p-8 text-muted-foreground">
								{chatLoading ? (
									<Loader2 className="animate-spin" />
								) : (
									'Error loading chats. Please try again.'
								)}
							</div>
						) : (
							<div className="flex flex-col space-y-4 p-4 border rounded-md bg-gray-50">
								{chatData?.data.map((chat) => (
									<div
										key={chat.id}
										className="flex flex-col space-y-2"
									>
										<div
											className="self-start bg-gray-200 p-4 rounded-lg cursor-pointer max-w-[60%] flex"
											onClick={() => openMetadata(chat)}
										>
											<Info className="mr-2 w-4" />
											{chat.query}
										</div>
										<div className="self-end bg-blue-100 p-4 rounded-lg max-w-[60%]">
											<div
												className="prose prose-sm max-w-none"
												dangerouslySetInnerHTML={{
													__html:
														chat.response &&
														chat.response.length > 0
															? JSON.parse(
																	chat.response,
																)
																? JSON.parse(
																		chat.response,
																	).answer
																: 'No response generated.'
															: 'No response generated.',
												}}
											/>
										</div>
									</div>
								))}
							</div>
						)}
					</TabsContent>
				</Tabs>
			</div>

			<Dialog open={showMetadata} onOpenChange={setShowMetadata}>
				<DialogContent className="sm:max-w-lg sm:w-full">
					<DialogHeader>
						<DialogTitle>Chat Metadata</DialogTitle>
					</DialogHeader>
					<div className="space-y-2">
						<p>
							<strong>Page URL:</strong>{' '}
							<a
								href={selectedChat?.pageUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="text-blue-500 underline"
							>
								{selectedChat?.pageUrl}
							</a>
						</p>
						<p>
							<strong>Date:</strong>{' '}
							{selectedChat
								? format(
										new Date(selectedChat.createdAt),
										'MMM dd, yyyy HH:mm',
									)
								: ''}
						</p>
						<p>
							<strong>Type:</strong>{' '}
							{selectedChat && (
								<StatusBadge status={selectedChat.type} />
							)}
						</p>
						<div className="mt-4">
							<p className="font-semibold">Retrieval Result:</p>
							{selectedChat && (
								<RetrievalDialog
									retrievalResult={
										selectedChat.retrieval_result
									}
								/>
							)}
						</div>
						<div className="mt-4">
							<p className="font-semibold">Answer:</p>
							{selectedChat && (
								<AnswerDialog summary={selectedChat.summary} />
							)}
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowMetadata(false)}
						>
							Close
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
