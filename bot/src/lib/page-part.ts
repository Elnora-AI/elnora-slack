/** A long page comes back in parts this size, so a paper is read whole rather than cut at its first part. */
export const EXTRACT_PART_CHARS = 30_000;

export function pagePart(text: string, offset: number) {
	const start = Math.max(0, Math.min(offset, text.length));
	const end = Math.min(text.length, start + EXTRACT_PART_CHARS);
	return {
		content: text.slice(start, end),
		offset: start,
		totalChars: text.length,
		nextOffset: end < text.length ? end : null,
	};
}
