import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import './globals.css';
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from '../components/ui/sidebar';
import { AppSidebar } from '../components/app-sidebar';
import { Separator } from '../components/ui/separator';

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
});

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
});

export const metadata: Metadata = {
	title: 'Dashboard - WPAI_Chatbot',
	description:
		'WPAI_Chatbot is an AI-powered assistant for your WordPress website',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<SidebarProvider>
					<AppSidebar />
					<SidebarInset>
						<header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
							<div className="flex items-center gap-2 px-4">
								<SidebarTrigger className="-ml-1" />
								<Separator
									orientation="vertical"
									className="mr-2 data-[orientation=vertical]:h-4"
								/>
							</div>
						</header>
						<main className="px-4">{children}</main>
					</SidebarInset>
				</SidebarProvider>
			</body>
		</html>
	);
}
