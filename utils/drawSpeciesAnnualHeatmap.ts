#!/usr/bin/env tsx

import fs from "node:fs";
import { createCanvas, type ImageData } from "canvas";
import { DateTime, Interval } from "luxon";
import type { BucketSpeciesObservationsQuery } from "../lib/birdWeather/codegen/graphql";
import { PROJECT_DIR } from "../lib/utils";
import { getSpeciesBucketCacheDirForSpeciesStationDuration } from "./shared";

type RawCachedBucketPeriod = { count: number; key: string };

type CachedBucketPeriodWithDateTime = RawCachedBucketPeriod & {
	timestamp: DateTime;
};

/**
 * Fetch all the data from a specific species/station cache set
 * @param speciesId
 * @param stationId
 * @param minutes
 */
function loadSpeciesBucketCache(
	speciesId: number,
	stationId: number,
	minutes: number,
): RawCachedBucketPeriod[] {
	const consistentFilesetRootDir =
		getSpeciesBucketCacheDirForSpeciesStationDuration(
			speciesId,
			stationId,
			minutes,
		);

	const allFiles = fs.readdirSync(consistentFilesetRootDir);

	let allData: RawCachedBucketPeriod[] = [];

	// console.log({ allFiles });
	for (const file of allFiles) {
		const data: BucketSpeciesObservationsQuery = JSON.parse(
			fs.readFileSync(`${consistentFilesetRootDir}/${file}`, {
				encoding: "utf-8",
			}),
		);
		allData = [
			...allData,
			...(data.species?.detectionCounts?.bins.map(({ count, key }) => ({
				count,
				key,
			})) || []),
		];
	}
	return allData;
}

function hydrateSpeciesBucketCacheDates(
	allData: RawCachedBucketPeriod[],
	targetTimeZone: string,
): CachedBucketPeriodWithDateTime[] {
	return allData.map((d) => ({
		...d,
		timestamp: DateTime.fromISO(d.key, { zone: targetTimeZone }),
	}));
}

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

async function main(): Promise<void> {
	// const speciesId = 408; //AMGO
	// const speciesId = 316; //junco
	const speciesId = 24; //DOWO
	const stationId = 11214; //nearby with decent history
	const minutes = 5;

	const allData = loadSpeciesBucketCache(speciesId, stationId, minutes);

	const targetTimeZone = "America/New_York";
	const withDates = hydrateSpeciesBucketCacheDates(allData, targetTimeZone);

	const maxCount = withDates.reduce(
		(prevMax, currentValue) =>
			currentValue.count > prevMax ? currentValue.count : prevMax,
		0,
	);

	const scale = 2;

	const width = 365 * scale;
	const height = 24 * 12 * scale;
	const myCanvas = createCanvas(width, height);
	const ctx = myCanvas.getContext("2d");
	ctx.fillStyle = "rgb(255,255,255)";
	ctx.fillRect(0, 0, width, height);

	const myImageData = ctx.getImageData(0, 0, width, height);

	for (const period of withDates) {
		const dayOfYear = Math.floor(
			Interval.fromDateTimes(
				period.timestamp.startOf("year"),
				period.timestamp,
			).length("days"),
		);
		const minuteOfDay = Interval.fromDateTimes(
			period.timestamp.startOf("day"),
			period.timestamp,
		).length("minutes");
		const tint = Math.floor((period.count / maxCount) * 255);
		const a = 255;
		const r = 255,
			b = 255 - tint,
			g = 255 - tint;

		const dayBucket = minuteOfDay / 5;
		for (let dx = 0; dx < scale; dx++) {
			for (let dy = 0; dy < scale; dy++) {
				plotPixelFromBottomLeft(
					myImageData,
					dayOfYear * scale + dx,
					dayBucket * scale + dy,
					r,
					g,
					b,
					a,
				);
			}
		}
	}

	ctx.putImageData(myImageData, 0, 0);

	const fileData = myCanvas.toBuffer("image/png");
	fs.writeFileSync(
		`${PROJECT_DIR}/tmp/yearHeatMap-station${stationId}-species${speciesId}.png`,
		fileData,
	);
}

main().finally(() => console.log("DONE"));
