'use server';

export async function logActivity(
	trackUID: string | null,
	action: string,
	metadata: object = {},
): Promise<void> {
	if (!trackUID || !action) {
		return;
	}

	try {
		const url = 'https://salespanel.io/api/v1/custom-activity/create/';

		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Token ${process.env.SALESPANEL_TOKEN}`,
			},
			body: JSON.stringify({
				visitor_identifier: trackUID,
				category: 'wpai-chatbot',
				label: action,
				metadata: metadata,
			}),
		});

		if (!response.ok) {
			console.error(`Failed to log activity: ${response.status}`);
		}
	} catch (error) {
		console.error('Error logging activity:', error);
	}
}
