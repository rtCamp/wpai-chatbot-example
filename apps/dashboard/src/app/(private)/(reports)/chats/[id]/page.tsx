import SingleChatPageClient from './page-client';

interface SingleChatPageParams {
	params: Promise<{ id: string }>;
}

export default async function SingleChatPage({ params }: SingleChatPageParams) {
	return <SingleChatPageClient params={await params} />;
}
