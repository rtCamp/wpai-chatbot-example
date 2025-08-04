import { NextRequest, NextResponse } from 'next/server';
import { getM2MToken } from '@wpai-chatbot/dashboard/lib/logto-m2m';

export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;
	const email = searchParams.get('email');
	const page = parseInt(searchParams.get('page') || '1', 10);
	const pageSize = parseInt(searchParams.get('limit') || '10', 10);

	try {
		const token = await getM2MToken();

		const params = new URLSearchParams();

		if (email) params.append('email', email);

		const response = await fetch(
			`${process.env.LOGTO_ENDPOINT}/api/users?${params.toString()}`,
			{
				headers: {
					Authorization: `Bearer ${token}`,
					accept: '*/*',
				},
			},
		);

		if (!response.ok) {
			return NextResponse.json(
				{ error: 'Failed to fetch users' },
				{ status: response.status },
			);
		}

		const allUsers = await response.json();

		const total = allUsers.length;
		const startIndex = (page - 1) * pageSize;
		const endIndex = startIndex + pageSize;
		const paginatedUsers = allUsers.slice(startIndex, endIndex);

		return NextResponse.json({
			data: paginatedUsers,
			meta: {
				total,
				page,
				pages: Math.ceil(total / pageSize),
				limit: pageSize,
			},
		});
	} catch (error) {
		console.error('Error fetching users:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 },
		);
	}
}
