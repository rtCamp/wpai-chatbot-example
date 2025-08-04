'use client';

import { useEffect, useState, useRef } from 'react';
import { EllipsisVertical, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getUrls } from '@wpai-chatbot/dashboard/lib/get-urls';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@wpai-chatbot/dashboard/components/ui/table';
import {
	Select,
	SelectTrigger,
	SelectContent,
	SelectItem,
	SelectValue,
} from '@wpai-chatbot/dashboard/components/ui/select';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogFooter,
	DialogTitle,
	DialogDescription,
	DialogClose,
} from '@wpai-chatbot/dashboard/components/ui/dialog';
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
} from '@wpai-chatbot/dashboard/components/ui/dropdown-menu';
import { Badge } from '@wpai-chatbot/dashboard/components/ui/badge';
import { Button } from '@wpai-chatbot/dashboard/components/ui/button';
import { setCrawlFrequency } from '@wpai-chatbot/dashboard/lib/actions/firecrawl/set-crawl-frequency';
import { deleteIntegratedUrl } from '@wpai-chatbot/dashboard/lib/actions/firecrawl/delete-integrated-url';

type UrlEntry = {
	id: string;
	url: string;
	status: string;
	isScraping: boolean;
	statusColor: string;
	frequency: string;
	isDeleting: boolean;
};

export default function UrlList({
	refreshkey,
	onSuccess,
}: {
	refreshkey: number;
	onSuccess: () => void;
}) {
	const [urls, setUrls] = useState<UrlEntry[]>([]);
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState('');
	const [isSuccess, setIsSuccess] = useState(false);
	const [streamMessages, setStreamMessages] = useState<string[]>([]);
	const bottomRef = useRef<HTMLDivElement | null>(null);
	const [openDialogUrl, setOpenDialogUrl] = useState<string | null>(null);
	const [dialogAction, setDialogAction] = useState<'crawl' | 'delete'>(
		'crawl',
	);
	const [actionInProgress, setActionInProgress] = useState(false);

	useEffect(() => {
		const fetchUrls = async () => {
			setLoading(true);
			const fetched = await getUrls('/firecrawl/get-integrated-websites');
			if (fetched.error) {
				setLoading(false);
				return;
			}

			const withColors: UrlEntry[] = fetched.map((entry: UrlEntry) => {
				let statusColor = '';
				switch (entry.status.toLowerCase()) {
					case 'pending':
						statusColor = 'text-yellow-500';
						break;
					case 'failed':
						statusColor = 'text-red-500';
						break;
					case 'crawled':
						statusColor = 'text-green-500';
						break;
					case 'no new content':
						statusColor = 'text-green-500';
						break;
					default:
						statusColor = ''; // or a default color
				}

				return { ...entry, statusColor };
			});
			setUrls(withColors);
			setLoading(false);
		};
		fetchUrls();
	}, [refreshkey]);

	const handleCrawl = async (url: string) => {
		setOpenDialogUrl(null);
		setStreamMessages([]);
		setMessage('');
		setIsSuccess(false);
		setActionInProgress(true);
		// Update the URL's scrape state to true
		setUrls((prevUrls) =>
			prevUrls.map((entry) =>
				entry.url === url ? { ...entry, isScraping: true } : entry,
			),
		);

		const res = await fetch(
			`${process.env.NEXT_PUBLIC_API_BASE_URL}/firecrawl/crawl-website`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '',
				},
				body: JSON.stringify({ url }),
			},
		);

		if (!res.body) {
			console.error('Response body is null');
			return;
		}

		const reader = res.body.getReader();
		const decoder = new TextDecoder();

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			const textChunk = decoder.decode(value);
			const lines = textChunk.trim().split('\n');

			for (const line of lines) {
				try {
					const parsed = JSON.parse(line);

					if (parsed.status === 'started') {
						setStreamMessages((prev) => [
							...prev,
							`Crawling website`,
						]);
					} else if (parsed.status === 'progress') {
						setStreamMessages((prev) => [
							...prev,
							`Website crawling in progress: ${parsed.completed} URLs scraped out of ${parsed.total}.`,
						]);
					} else if (parsed.status === 'populating') {
						const urls = parsed.urls || [];
						const message = [
							"Populating WPAI_Chatbot's knowledge base:",
							...urls.map((url: string) => `- ${url}`),
							"added to WPAI_Chatbot's knowledge.",
						].join('\n');

						setStreamMessages((prev) => [...prev, message]);
					} else if (parsed.status === 'completed') {
						setStreamMessages((prev) => [
							...prev,
							`Crawling and population completed.`,
						]);
					} else if (parsed.status === 'error') {
						setStreamMessages((prev) => [
							...prev,
							`Error: ${parsed.message}`,
						]);
					} else if (parsed.status === 'no new content') {
						setStreamMessages((prev) => [...prev, parsed.message]);
					}
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
				} catch (err) {
					console.error('Failed to parse stream chunk line:', line);
				}
			}
		}

		// Update the URL's scrape state based on response
		setUrls((prevUrls) =>
			prevUrls.map((entry) =>
				entry.url === url ? { ...entry, isScraping: false } : entry,
			),
		);

		setActionInProgress(false);
		setMessage(`${url} crawled successfully`);
		setIsSuccess(true);

		setUrls((prevUrls) =>
			prevUrls.map((entry) =>
				entry.url === url
					? {
							...entry,
							status: 'crawled',
							statusColor: 'text-green-500',
						}
					: entry,
			),
		);

		setTimeout(() => {
			setActionInProgress(false);
			setMessage('');
			setIsSuccess(false);
		}, 4000);
	};

	useEffect(() => {
		if (bottomRef.current) {
			bottomRef.current.scrollIntoView({ behavior: 'smooth' });
		}
	}, [streamMessages]);

	const onSelectChange = async (url: string, value: string) => {
		setUrls((prevUrls) => {
			return prevUrls.map((urlEntry) => {
				if (urlEntry.url === url) {
					return { ...urlEntry, frequency: value };
				}
				return urlEntry;
			});
		});

		const result = await setCrawlFrequency(
			url,
			value,
			'/firecrawl/set-integrated-website-frequency',
		);

		if (result.error) {
			setUrls((prevUrls) => {
				return prevUrls.map((urlEntry) => {
					if (urlEntry.url === url) {
						return { ...urlEntry, frequency: urlEntry.frequency };
					}
					return urlEntry;
				});
			});
		}
	};

	const handleDelete = async (url: string) => {
		setOpenDialogUrl(null);
		setActionInProgress(true);

		setUrls((prevUrls) =>
			prevUrls.map((entry) =>
				entry.url === url ? { ...entry, isDeleting: true } : entry,
			),
		);

		const response = await deleteIntegratedUrl(
			url,
			'/firecrawl/delete-integrated-website',
		);

		if (response.error) {
			setMessage(response.error);
			setIsSuccess(false);

			setUrls((prevUrls) =>
				prevUrls.map((entry) =>
					entry.url === url ? { ...entry, isDeleting: false } : entry,
				),
			);

			setTimeout(() => {
				setMessage('');
				setIsSuccess(false);
			}, 3000);
			return;
		}

		setMessage(`${url} deleted successfully`);
		setIsSuccess(true);

		setActionInProgress(false);
		setUrls((prevUrls) =>
			prevUrls.map((entry) =>
				entry.url === url ? { ...entry, isDeleting: false } : entry,
			),
		);

		setStreamMessages([]);

		setTimeout(() => {
			setMessage('');
			setIsSuccess(false);
			setActionInProgress(false);
			onSuccess?.();
		}, 3000);
	};

	useEffect(() => {
		if (message && message.length > 0) {
			toast(message, {
				style: {
					backgroundColor:
						message.length > 0 && isSuccess ? '#4ade80' : '#f87171',
					color: '#1f2937',
				},
				duration: 4000,
			});
		}
	}, [message, isSuccess]);

	if (loading)
		return (
			<div>
				<Loader2 className="h-6 w-6 animate-spin mx-auto mt-[100px]" />
			</div>
		);

	return (
		<>
			<div className="flex flex-col flex-grow h-[calc(100vh-188px)] overflow-hidden">
				<Table className="overflow-auto mt-4 min-w-full">
					<TableHeader>
						<TableRow>
							<TableHead style={{ width: '60%' }}>URL</TableHead>
							<TableHead style={{ width: '15%' }}>
								Actions
							</TableHead>
							<TableHead style={{ width: '10%' }}>
								Schedule
							</TableHead>
							<TableHead style={{ width: '15%' }}>
								Status
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{urls.map((entry) => (
							<TableRow key={entry.id}>
								<TableCell style={{ width: '60%' }}>
									{entry.url}
								</TableCell>
								<TableCell
									style={{ width: '15%' }}
									className="flex flex-col gap-2"
								>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												variant="outline"
												size="icon"
											>
												<EllipsisVertical className="h-4 w-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent className="w-56">
											<DropdownMenuItem>
												<Button
													variant="outline"
													className="w-full cursor-pointer"
													disabled={
														entry.isDeleting ||
														entry.isScraping ||
														actionInProgress
													}
													onClick={() => {
														setDialogAction(
															'crawl',
														);
														setOpenDialogUrl(
															entry.url,
														);
													}}
												>
													{entry.isScraping
														? 'Crawling...'
														: 'Crawl'}
												</Button>
											</DropdownMenuItem>
											<DropdownMenuItem>
												<Button
													variant="destructive"
													className="w-full cursor-pointer"
													disabled={
														entry.isDeleting ||
														entry.isScraping ||
														actionInProgress
													}
													onClick={() => {
														setDialogAction(
															'delete',
														);
														setOpenDialogUrl(
															entry.url,
														);
													}}
												>
													{entry.isDeleting
														? 'Deleting...'
														: 'Delete'}
												</Button>
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
									<Dialog
										open={openDialogUrl === entry.url}
										onOpenChange={(isOpen) =>
											!isOpen && setOpenDialogUrl(null)
										}
									>
										<DialogContent>
											<DialogHeader>
												<DialogTitle>
													Are you sure?
												</DialogTitle>
												<DialogDescription>
													{dialogAction === 'crawl'
														? 'Scraping a site will consume credits and may incur additional costs. Do you want to continue?'
														: 'This will permanently delete the site entry. This action cannot be undone. Proceed?'}
												</DialogDescription>
											</DialogHeader>
											<DialogFooter>
												<DialogClose asChild>
													<Button variant="outline">
														No
													</Button>
												</DialogClose>
												<Button
													onClick={() =>
														dialogAction === 'crawl'
															? handleCrawl(
																	entry.url,
																)
															: handleDelete(
																	entry.url,
																)
													}
												>
													Yes
												</Button>
											</DialogFooter>
										</DialogContent>
									</Dialog>
								</TableCell>
								<TableCell style={{ width: '10%' }}>
									<Select
										value={entry.frequency}
										onValueChange={(value) => {
											onSelectChange(entry.url, value);
										}}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select frequency" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="never">
												Never
											</SelectItem>
											<SelectItem value="daily">
												Daily
											</SelectItem>
											<SelectItem value="weekly">
												Weekly
											</SelectItem>
											<SelectItem value="monthly">
												Monthly
											</SelectItem>
											<SelectItem value="yearly">
												Yearly
											</SelectItem>
										</SelectContent>
									</Select>
								</TableCell>
								<TableCell
									style={{ width: '15%' }}
									className="capitalize"
								>
									<Badge
										className={`p-2
											${entry.status === 'failed' ? 'border-red-700' : entry.status === 'pending' ? 'border-yellow-700' : 'border-green-700'}
											${entry.status === 'failed' ? 'text-red-700' : entry.status === 'pending' ? 'text-yellow-700' : 'text-green-700'}`}
										variant="outline"
									>
										{entry.status === 'no new content'
											? 'crawled'
											: entry.status}
									</Badge>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
				{streamMessages.length > 0 && (
					<div className="flex-1 overflow-y-auto mt-4 space-y-2">
						{streamMessages.map((msg, index) => (
							<p
								key={index}
								className="text-xs bg-blue-100 border border-blue-300 rounded p-1"
							>
								{msg}
							</p>
						))}
						<div ref={bottomRef} />
					</div>
				)}
			</div>
		</>
	);
}
