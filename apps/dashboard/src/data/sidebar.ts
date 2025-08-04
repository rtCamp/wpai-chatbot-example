import {
	ChartSpline,
	Database,
	LayoutDashboard,
	MessageSquare,
} from 'lucide-react';

export const sidebarData = {
	navMain: [
		{
			title: 'Dashboard',
			url: '/',
			icon: LayoutDashboard,
		},
		{
			title: 'Reports',
			url: '/reports',
			icon: ChartSpline,
			items: [
				{
					title: 'Users',
					url: '/users',
				},
				{
					title: 'Chats',
					url: '/chats',
				},
			],
		},
		{
			title: 'Prompt Management',
			icon: MessageSquare,
			items: [
				{
					title: 'Prompt Placeholders',
					url: '/data/prompts/placeholders',
				},
				{
					title: 'Advanced Configuration',
					url: '/data/prompts',
				},
			],
		},
	],
	navData: [
		{
			title: 'Integrations',
			url: '/data/integrations',
			icon: Database,
			items: [
				{
					title: 'Linked Websites',
					url: '/data/integrations/linked-websites',
				},
			],
		},
		{
			title: 'Sources',
			url: '/data/sources',
			icon: Database,
			items: [
				{
					title: 'Scrape Webpage',
					url: '/data/sources/scrape-webpage',
				},
				{
					title: 'Docs',
					url: '/data/sources/docs',
				},
			],
		},
	],
};
