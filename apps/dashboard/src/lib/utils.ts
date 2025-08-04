import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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
