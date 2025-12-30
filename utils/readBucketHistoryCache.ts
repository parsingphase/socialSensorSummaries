#!/usr/bin/env tsx

import fs from "node:fs";
import { createCanvas } from "canvas";
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

async function main(): Promise<void> {
	const speciesId = 316; //junco
	const stationId = 11214; //nearby with decent history
	const minutes = 5;

	const allData = loadSpeciesBucketCache(speciesId, stationId, minutes);

	void allData;

	// console.log(JSON.stringify(allData, undefined, 2));
	const targetTimeZone = "America/New_York";
	const withDates = hydrateSpeciesBucketCacheDates(allData, targetTimeZone);

	const maxCount = withDates.reduce(
		(prevMax, currentValue) =>
			currentValue.count > prevMax ? currentValue.count : prevMax,
		0,
	);

	console.log({ withDates, maxCount });

	const width = 365;
	const height = 24 * 12;
	const myCanvas = createCanvas(width, height);
	const ctx = myCanvas.getContext("2d");

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
		const dayBucket = minuteOfDay / 5;
		// const pixelOffset = ((dayOfYear * height) + dayBucket) * 4;
		const pixelOffset = ((height - dayBucket) * width + dayOfYear) * 4;

		const opacity = (period.count / maxCount) * 255;
		myImageData.data[pixelOffset] = 0;
		myImageData.data[pixelOffset + 3] = Math.floor(opacity);

		console.log({ dayOfYear, minuteOfDay, dayBucket, opacity });
	}

	ctx.putImageData(myImageData, 0, 0);

	const fileData = myCanvas.toBuffer("image/png");
	fs.writeFileSync(`${PROJECT_DIR}/tmp/yearHeatMap-${speciesId}.png`, fileData);
}

main().finally(() => console.log("DONE"));
