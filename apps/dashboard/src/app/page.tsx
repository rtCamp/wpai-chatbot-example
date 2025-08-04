import { DashboardCard } from '../components/features/dashboard/dashboard-card';

export default function Page() {
	return (
		<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
			<div className="grid auto-rows-min gap-4 md:grid-cols-3">
				<DashboardCard title="View Chats" href="/chats" />
				<DashboardCard title="View Users" href="/users" />
			</div>
		</div>
	);
}
