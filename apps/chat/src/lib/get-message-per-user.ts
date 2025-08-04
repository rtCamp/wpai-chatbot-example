export async function getMessagePerUser(): Promise<number> {
	try {
		const response = await fetch(
			`${process.env.WPAI_CHATBOT_PLUGIN_SITE}/wp-json/wpai-chatbot/v1/messagePerUser`,
		);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		return data.messages_per_user ?? 3;
	} catch (error) {
		console.error('Failed to fetch messages_per_user:', error);
		return 3; // Fallback default
	}
}
