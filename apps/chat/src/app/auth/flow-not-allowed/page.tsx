import { BotOff, LogIn } from 'lucide-react';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Button } from '@wpai-chatbot/chat/components/ui/button';

export default async function FlowNotAllowed() {
	const returnUrl = (await cookies()).get('auth-return-url')?.value;

	return (
		<div className="flex flex-col gap-8 items-center p-8 w-[500px] mx-auto justify-center h-[100vh]">
			<BotOff />
			<span className="text-center">
				It looks like you used a personal email address to sign in. We
				are working on making WPAI_Chatbot accessible to all. Please use
				your business email address to access WPAI_Chatbot Beta.
			</span>
			<Link href={`${process.env.NEXT_PUBLIC_BASE_URL}${returnUrl}`}>
				<Button className="cursor-pointer">
					Login <LogIn />
				</Button>
			</Link>
		</div>
	);
}
