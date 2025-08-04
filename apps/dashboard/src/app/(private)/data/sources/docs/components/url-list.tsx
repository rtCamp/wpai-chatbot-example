'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getUrls } from '@wpai-chatbot/dashboard/lib/get-urls';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@wpai-chatbot/dashboard/components/ui/table'; // adjust path if needed
import {
	Select,
	SelectTrigger,
	SelectContent,
	SelectItem,
	SelectValue,
} from '@wpai-chatbot/dashboard/components/ui/select';
import {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogHeader,
	DialogFooter,
	DialogTitle,
	DialogDescription,
	DialogClose,
} from '@wpai-chatbot/dashboard/components/ui/dialog';
import { Badge } from '@wpai-chatbot/dashboard/components/ui/badge';
import { Button } from '@wpai-chatbot/dashboard/components/ui/button';
import { scrapeDocsUrl } from '@wpai-chatbot/dashboard/lib/actions/firecrawl/scrape-docs-url';
import { setCrawlFrequency } from '@wpai-chatbot/dashboard/lib/actions/firecrawl/set-crawl-frequency';

type UrlEntry = {
	id: string;
	url: string;
	status: string;
	isScraping: boolean;
	statusColor: string;
	frequency: string;
};

export default function UrlList({ refreshkey }: { refreshkey: number }) {
	const [urls, setUrls] = useState<UrlEntry[]>([]);
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState('');
	const [isSuccess, setIsSuccess] = useState(false);
	const [openDialogUrl, setOpenDialogUrl] = useState<string | null>(null);

	useEffect(() => {
		const fetchUrls = async () => {
			setLoading(true);
			const fetched = await getUrls('/firecrawl/get-docs-urls');
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
					case 'scraped':
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

	const handleScrape = async (url: string) => {
		setOpenDialogUrl(null);
		// Update the URL's scrape state to true
		setUrls((prevUrls) =>
			prevUrls.map((entry) =>
				entry.url === url ? { ...entry, isScraping: true } : entry,
			),
		);

		const response = await scrapeDocsUrl(url);

		// Update the URL's scrape state based on response
		setUrls((prevUrls) =>
			prevUrls.map((entry) =>
				entry.url === url ? { ...entry, isScraping: false } : entry,
			),
		);

		if (response.error) {
			const isNoChange = response.error.includes(
				'No changes detected in the url. No update needed.',
			);
			setMessage(response.error);
			setIsSuccess(false);

			setUrls((prevUrls) =>
				prevUrls.map((entry) =>
					entry.url === url
						? {
								...entry,
								status: isNoChange
									? 'no new content'
									: 'failed',
								statusColor: isNoChange
									? 'text-green-500'
									: 'text-red-500',
							}
						: entry,
				),
			);

			setTimeout(() => {
				setMessage('');
				setIsSuccess(false);
			}, 4000);
			return;
		}

		setMessage(`${url} scraped successfully`);
		setIsSuccess(true);

		setUrls((prevUrls) =>
			prevUrls.map((entry) =>
				entry.url === url
					? {
							...entry,
							status: 'scraped',
							statusColor: 'text-green-500',
						}
					: entry,
			),
		);

		setTimeout(() => {
			setMessage('');
			setIsSuccess(false);
		}, 4000);
	};

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
			'/firecrawl/set-docs-frequency',
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
			<Table className="mt-4">
				<TableHeader>
					<TableRow>
						<TableHead style={{ width: '60%' }}>URL</TableHead>
						<TableHead style={{ width: '15%' }}>Actions</TableHead>
						<TableHead style={{ width: '10%' }}>Schedule</TableHead>
						<TableHead style={{ width: '15%' }}>Status</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{urls.map((entry) => (
						<TableRow key={entry.id}>
							<TableCell style={{ width: '60%' }}>
								{entry.url}
							</TableCell>
							<TableCell style={{ width: '15%' }}>
								<Dialog
									open={openDialogUrl === entry.url}
									onOpenChange={(isOpen) =>
										!isOpen && setOpenDialogUrl(null)
									}
								>
									<DialogTrigger asChild>
										<Button
											size="sm"
											onClick={() =>
												setOpenDialogUrl(entry.url)
											}
										>
											{entry.isScraping
												? 'Scraping...'
												: 'Scrape'}
										</Button>
									</DialogTrigger>
									<DialogContent>
										<DialogHeader>
											<DialogTitle>
												Are you sure?
											</DialogTitle>
											<DialogDescription>
												Scraping a site will consume
												credits and may incur additional
												costs. Do you want to continue?
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
													handleScrape(entry.url)
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
								className={`${entry.statusColor} capitalize`}
							>
								<Badge
									className={`p-2
										${entry.status === 'failed' ? 'border-red-700' : entry.status === 'pending' ? 'border-yellow-700' : 'border-green-700'}
										${entry.status === 'failed' ? 'text-red-700' : entry.status === 'pending' ? 'text-yellow-700' : 'text-green-700'}`}
									variant="outline"
								>
									{entry.status === 'no new content'
										? 'scraped'
										: entry.status}
								</Badge>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</>
	);
}
