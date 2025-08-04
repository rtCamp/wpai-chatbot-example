'use client';

import { useTransition } from 'react';
import { usePathname } from 'next/navigation';
import { Loader2, LogOut } from 'lucide-react';
import { Button } from '@wpai-chatbot/chat/components/ui/button';

import { signOutLogto } from './actions/signOut';

export function SignOutButton({ className }: { className?: string }) {
	const [isPending, startTransition] = useTransition();
	const pathname = usePathname();

	const handleLogout = () => {
		const formData = new FormData();
		formData.append('returnUrl', pathname);

		startTransition(() => {
			signOutLogto(formData);
		});
	};

	return (
		<Button
			onClick={handleLogout}
			disabled={isPending}
			className={className}
			variant="ghost"
			size="icon"
		>
			{isPending ? <Loader2 className="animate-spin" /> : <LogOut />}
		</Button>
	);
}
