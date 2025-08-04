import type { Metadata } from 'next';
import '../../globals.css';
import './style.css';

export const metadata: Metadata = {
	title: 'WPAI_Chatbot',
	description:
		'WPAI_Chatbot is an AI-powered assistant for your WordPress website',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<main className="mx-auto max-w-[450px] min-h-[500px] h-[100vh]">
			{children}
		</main>
	);
}
