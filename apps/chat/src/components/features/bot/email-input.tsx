'use client';

import { ArrowUp } from 'lucide-react';

import { Button } from '../../ui/button';
import { Input } from '../../ui/input';

interface EmailInputProps {
	onUpdateUserInfo: (email: string, name: string) => void;
	name: string;
	email: string;
	setName: (name: string) => void;
	setEmail: (email: string) => void;
	setEmailSubmitSuccess: (success: string) => void;
}

export function EmailInput({
	onUpdateUserInfo,
	name,
	email,
	setName,
	setEmail,
	setEmailSubmitSuccess,
}: EmailInputProps) {
	const isValidEmail = (email: string) =>
		/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

	const handleSubmit = () => {
		if (isValidEmail(email)) {
			setEmailSubmitSuccess('submitted');
			onUpdateUserInfo(email, name);
		}
	};

	const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.key === 'Enter' && isValidEmail(email)) {
			event.preventDefault();
			handleSubmit();
		}
	};

	return (
		<div className="flex flex-row items-center gap-4">
			<div className="flex flex-col gap-2 flex-1">
				<Input
					type="text"
					placeholder="Your name"
					value={name}
					onChange={(e) => setName(e.target.value)}
				/>
				<Input
					type="email"
					placeholder="Your email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					onKeyDown={handleKeyDown}
				/>
			</div>
			<Button
				onClick={handleSubmit}
				disabled={!isValidEmail(email)}
				className="h-auto self-center"
			>
				<ArrowUp className="h-4 w-4" />
			</Button>
		</div>
	);
}
