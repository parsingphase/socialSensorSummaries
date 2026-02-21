import type { ImageData } from "canvas";

type LatLon = {
	lat: number;
	lon: number;
};

/**
 * Color component number range is 0…255
 * @param myImageData
 * @param x
 * @param y
 * @param r
 * @param g
 * @param b
 * @param a
 */
function plotPixelFromBottomLeft(
	myImageData: ImageData,
	x: number,
	y: number,
	r: number,
	g: number,
	b: number,
	a: number,
) {
	const pixelOffset = ((myImageData.height - y) * myImageData.width + x) * 4;

	myImageData.data[pixelOffset] = r;
	myImageData.data[pixelOffset + 1] = g;
	myImageData.data[pixelOffset + 2] = b;
	myImageData.data[pixelOffset + 3] = a;
}

export { plotPixelFromBottomLeft };
export type { LatLon };
