import { fetchApi } from '@wpai-chatbot/chat/lib/api';

type UpdateUserInput = {
	id: string;
	updateUserInfo: {
		name?: string;
		email?: string;
		track_uid?: string;
	};
};

export async function updateUser({ id, updateUserInfo }: UpdateUserInput) {
	return await fetchApi(`/sessions/user/${id}`, {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(updateUserInfo),
	});
}
