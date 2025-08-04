'use client';

interface StatusBadgeProps {
	status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
	const badgeClasses = `px-2 py-1 rounded-full text-xs ${
		['retrieval', 'retrieval_date_decay'].includes(status)
			? 'bg-green-100 text-green-800'
			: status === 'blocked'
				? 'bg-red-100 text-red-800'
				: 'bg-yellow-100 text-yellow-800'
	}`;

	return <span className={badgeClasses}>{status}</span>;
}
