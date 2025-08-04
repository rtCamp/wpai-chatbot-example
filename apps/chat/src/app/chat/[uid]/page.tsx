import AuthGate from './non-auth-wrapper';
import SetTrackUID from './set-track-uid';
import SetCurrentPageUrl from './set-current-page-url';

export default async function ChatPage({
	searchParams,
}: {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	searchParams: any;
}) {
	const { track_uid, pageUrl } = await searchParams;

	// if (token) {
	//   return <TokenAuthWrapper token={token as string} pageUrl={pageUrl} />;
	// }

	// const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);

	return (
		<>
			<SetCurrentPageUrl pageUrl={pageUrl} />
			<SetTrackUID track_uid={track_uid} />
			{/* {!isAuthenticated ? ( */}
			<AuthGate pageUrl={pageUrl} />
			{/* ) : (
        <ChatInterfacePage claims={claims} pageUrl={pageUrl} />
      )} */}
		</>
	);
}
