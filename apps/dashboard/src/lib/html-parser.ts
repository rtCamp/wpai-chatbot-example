export function safelySplitHtml(html: string): string[] {
	// First separate HTML tags from text content
	const result: string[] = [];
	let inTag = false;
	let currentChunk = '';

	for (let i = 0; i < html.length; i++) {
		const char = html[i];

		// Track if we're inside a tag
		if (char === '<') {
			// End current text chunk if any
			if (currentChunk && !inTag) {
				result.push(currentChunk);
				currentChunk = '';
			}
			inTag = true;
			currentChunk += char;
		} else if (char === '>' && inTag) {
			// Complete the tag
			currentChunk += char;
			result.push(currentChunk);
			currentChunk = '';
			inTag = false;
		} else {
			currentChunk += char;

			// If we're not in a tag and we hit a space, break the chunk
			if (!inTag && char === ' ' && currentChunk.trim()) {
				result.push(currentChunk);
				currentChunk = '';
			}
		}
	}

	// Add any remaining text
	if (currentChunk) {
		result.push(currentChunk);
	}

	return result;
}
