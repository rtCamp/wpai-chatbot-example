import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export async function GET() {
	// Retrieve the return URL from cookies
	const returnUrl = (await cookies()).get('logout-return-url')?.value || '/';

	// Clear the cookie
	(
		await // Clear the cookie
		cookies()
	).delete('logout-return-url');

	// Redirect to the original page
	redirect(returnUrl);
}
