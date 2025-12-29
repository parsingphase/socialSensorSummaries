/**
 * Convert dict to HTTP query string
 *
 * @param obj
 */
function objectToQueryString(obj: {
	[key: string]: number | string | undefined;
}): string {
	return Object.keys(obj)
		.filter((key) => typeof obj[key] !== "undefined")
		.map(
			// biome-ignore lint/style/noNonNullAssertion: FIXME cleanup
			(key) => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key]!)}`,
		)
		.join("&");
}

export { objectToQueryString };
