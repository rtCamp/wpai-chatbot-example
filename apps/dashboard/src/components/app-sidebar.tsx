'use client';

import * as React from 'react';
import { NavMain } from '@wpai-chatbot/dashboard/components/nav-main';
import {
	Sidebar,
	SidebarContent,
	SidebarRail,
} from '@wpai-chatbot/dashboard/components/ui/sidebar';

import { sidebarData } from '../data/sidebar';

import { NavData } from './nav-data';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarContent>
				<NavMain items={sidebarData.navMain} />
				<NavData items={sidebarData.navData} />
			</SidebarContent>
			<SidebarRail />
		</Sidebar>
	);
}
