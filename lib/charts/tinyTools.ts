import type { TinyColor } from "@ctrl/tinycolor";

// all values should be 0…255
type Rgba255 = {
	r: number;
	g: number;
	b: number;
	a: number;
};

/**
 * Components of a TinyColorRgba object, mapped such that all fields are 0…255
 *
 * Eg for use in an ImageData array
 *
 * @param tinyColor
 */
function tinyColorToRgba255(tinyColor: TinyColor): Rgba255 {
	const { r, g, b, a } = tinyColor.toRgb();
	return { r, g, b, a: Math.round(a * 255) };
}

export { tinyColorToRgba255 };
