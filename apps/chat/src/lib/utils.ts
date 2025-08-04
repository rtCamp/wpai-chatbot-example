import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { marked } from 'marked';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const timeAgo = (date: Date) => {
	const now: Date = new Date();
	const past: Date = new Date(date);
	const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

	const intervals = {
		year: 31536000,
		month: 2592000,
		week: 604800,
		day: 86400,
		hour: 3600,
		minute: 60,
		second: 1,
	};

	for (const unit of Object.keys(intervals) as (keyof typeof intervals)[]) {
		const value = Math.floor(seconds / intervals[unit]);
		if (value > 0) {
			return `${value} ${unit}${value !== 1 ? 's' : ''} ago`;
		}
	}
	return 'just now';
};

export async function getCaptchaToken(action: string): Promise<string | null> {
	return new Promise<string | null>((resolve) => {
		grecaptcha.ready(async () => {
			const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

			if (!siteKey) {
				resolve(null);
				return;
			}

			const token = await grecaptcha.execute(siteKey, { action });

			resolve(token);
		});
	});
}

export function generateUUID() {
	if (crypto.randomUUID) return crypto.randomUUID();

	const bytes = crypto.getRandomValues(new Uint8Array(16));
	// Set version bits (4) and variant bits (10).
	bytes[6] = (bytes[6] & 0x0f) | 0x40;
	bytes[8] = (bytes[8] & 0x3f) | 0x80;

	return [...bytes]
		.map((b, i) => {
			const s = b.toString(16).padStart(2, '0');
			return [4, 6, 8, 10].includes(i) ? `-${s}` : s;
		})
		.join('');
}

export function getTrackUID() {
	if (!window) {
		return null;
	}

	const url = new URL(window.location.href);
	let trackUID = url.searchParams.get('track_uid');

	// Fallback to localStorage if not found in URL. This is useful when user is redirected
	// and the track_uid is not present in the URL.
	if (!trackUID) {
		trackUID = localStorage.getItem('track_uid');
	}

	return trackUID;
}

export function markdownToHtml(markdown: string): string {
	const renderer = new marked.Renderer();
	renderer.link = function ({
		href,
		title,
		text,
	}: {
		href?: string | null;
		title?: string | null;
		text: string;
	}) {
		return `<a href="${href ?? ''}" title="${title ?? ''}" target="_blank" rel="noopener noreferrer">${text}</a>`;
	};

	marked.setOptions({
		renderer: renderer,
	});

	return marked.parse(markdown) as string;
}
