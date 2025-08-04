export async function verifyCaptcha(token: string): Promise<boolean> {
	const secretKey = process.env.RECAPTCHA_SECRET_KEY;

	if (!secretKey) {
		throw new Error('RECAPTCHA_SECRET_KEY is not defined');
	}

	const url = new URL('https://www.google.com/recaptcha/api/siteverify');
	url.searchParams.append('secret', secretKey);
	url.searchParams.append('response', token);

	const res = await fetch(url, { method: 'POST' });

	if (!res.ok) {
		throw new Error('Failed to verify captcha');
	}

	const { success, score }: { success: boolean; score: number } =
		await res.json();

	return success && score >= 0.5;
}
