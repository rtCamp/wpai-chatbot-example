import { useEffect, useState } from 'react';

export function useInIframe() {
	const [isInIframe, setIsInIframe] = useState(false);

	useEffect(() => {
		// Check if window is defined (for SSR)
		if (typeof window !== 'undefined') {
			try {
				setIsInIframe(window.self !== window.top);
			} catch {
				setIsInIframe(true);
			}
		}
	}, []);

	return isInIframe;
}
