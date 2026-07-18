import path from "node:path";

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

function lpad(s: string | number, length: number) {
	return "0".repeat(length - `${s}`.length) + s;
}

function rbgToHexColor(red: number, green: number, blue: number): string {
	function toHexPair(component: number) {
		const s = component.toString(16);
		const length = 2;
		return lpad(s, length);
	}
	return `#${toHexPair(red)}${toHexPair(green)}${toHexPair(blue)}`.toUpperCase();
}

const PROJECT_DIR = path.dirname(path.dirname(__dirname));

export { lpad, objectToQueryString, rbgToHexColor, PROJECT_DIR };
