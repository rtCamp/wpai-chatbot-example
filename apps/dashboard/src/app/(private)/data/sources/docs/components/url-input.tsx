'use client';
import { useState } from 'react';
import { Input } from '@wpai-chatbot/dashboard/components/ui/input';
import { Button } from '@wpai-chatbot/dashboard/components/ui/button';
import { addUrl } from '@wpai-chatbot/dashboard/lib/add-url';
import { docsPermission } from '@wpai-chatbot/dashboard/lib/actions/firecrawl/docsPermission';

export default function UrlInput({ onSuccess }: { onSuccess: () => void }) {
	const [url, setUrl] = useState('');
	const [isValid, setIsValid] = useState(false);
	const [isScraping, setIsScraping] = useState(false);
	const [message, setMessage] = useState('');
	const [isSuccess, setIsSuccess] = useState(false);

	const isValidUrl = (str: string) => {
		try {
			const urlPattern =
				/^https?:\/\/(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?$/i;
			if (!urlPattern.test(str)) return false;
			const url = new URL(str);
			if (url.hostname !== 'docs.google.com') return false;

			const validPath = /^\/document\/d\/[a-zA-Z0-9_-]+(\/edit)?$/;
			if (!validPath.test(url.pathname)) return false;

			return /^\/document\/d\/[^/]+/.test(url.pathname);
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
		} catch (_) {
			return false;
		}
	};

	const handleSetUrl = (value: string) => {
		setUrl(value);
		setIsValid(isValidUrl(value));
	};

	const handleAddUrl = async () => {
		if (url && isValidUrl(url)) {
			setIsScraping(true);
			const hasPermission = await docsPermission(
				url,
				process.env.NEXT_PUBLIC_GOOGLE_DOCS_CLIENT_MAIL || '',
			);
			if (!hasPermission || hasPermission.error) {
				setMessage(
					`${process.env.NEXT_PUBLIC_GOOGLE_DOCS_CLIENT_MAIL} does not have permission to scrape ${url}`,
				);
				setIsSuccess(false);
				setIsScraping(false);
				setTimeout(() => {
					setMessage('');
					setIsSuccess(false);
				}, 5000);
				return;
			}

			setIsValid(true);
			const urlResponse = await addUrl(url, '/firecrawl/add-docs-url');
			if (urlResponse.error) {
				setMessage(urlResponse.error);
				setIsSuccess(false);
				setIsScraping(false);
				setTimeout(() => {
					setMessage('');
					setIsSuccess(false);
				}, 3000);
				return;
			}
			setMessage('URL added successfully');
			setIsSuccess(true);
			setTimeout(() => {
				setMessage('');
				setIsSuccess(false);
			}, 3000);
			setIsScraping(false);
			setUrl('');
			onSuccess?.();
		} else {
			console.warn('Invalid URL');
			setIsValid(false);
		}
	};

	return (
		<>
			<div className="mt-4 flex gap-2">
				<Input
					type="url"
					aria-label="URL"
					placeholder="Enter URL"
					className="w-md h-12"
					value={url}
					onChange={(e) => handleSetUrl(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === 'Enter') {
							handleAddUrl();
						}
					}}
				/>
				<Button
					variant="default"
					className="h-12 cursor-pointer"
					onClick={() => handleAddUrl()}
					disabled={!isValid}
				>
					{isScraping ? 'Adding your URL...' : 'Add URL'}
				</Button>
			</div>
			{message && message.length > 0 && (
				<p
					className={`text-sm mt-2 p-2 w-full ${message.length > 0 && isSuccess ? 'bg-green-400 text-white-800' : 'bg-red-400 text-white-800'}`}
				>
					{message}
				</p>
			)}
		</>
	);
}
