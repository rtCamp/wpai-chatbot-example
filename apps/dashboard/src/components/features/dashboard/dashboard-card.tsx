import Link from 'next/link';
import { ArrowRightCircle } from 'lucide-react';

import { Button } from '../../ui/button';

interface DashboardCardProps {
	title: string;
	href: string;
}

export function DashboardCard({ title, href }: DashboardCardProps) {
	return (
		<div className="bg-muted/50 aspect-video rounded-xl p-8 font-bold flex flex-col">
			<div className="grow">{title}</div>
			<Link href={href} className="ml-auto">
				<Button size="icon" className="cursor-pointer">
					<ArrowRightCircle />
				</Button>
			</Link>
		</div>
	);
}
