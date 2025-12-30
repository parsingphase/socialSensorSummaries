#!/usr/bin/env tsx

import fs from "node:fs";
import { createCanvas, type ImageData } from "canvas";
import { DateTime, Interval } from "luxon";
import SunCalc from "suncalc";
import { config } from "../config/config";
import type { BucketSpeciesObservationsQuery } from "../lib/birdWeather/codegen/graphql";
import { fetchStationInfo } from "../lib/birdWeather/fetch";
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

function dateTimeToBucket(timestamp: DateTime, scale = 1) {
	const dayOfYear = Math.floor(
		Interval.fromDateTimes(timestamp.startOf("year"), timestamp).length("days"),
	);
	const minuteOfDay = Interval.fromDateTimes(
		timestamp.startOf("day"),
		timestamp,
	).length("minutes");

	const dayBucket = Math.floor((scale * minuteOfDay) / 5) / scale;
	return { dayOfYear, dayBucket };
}

function getSunriseSunsetForDateTime(
	location: {
		latitude: number;
		longitude: number;
	},
	timestamp: DateTime,
) {
	const { latitude, longitude } = location;
	const envTimes = SunCalc.getTimes(timestamp.toJSDate(), latitude, longitude);
	const { sunrise: sunriseDT, sunset: sunsetDT } = envTimes;

	const sunrise = DateTime.fromJSDate(sunriseDT);
	const sunset = DateTime.fromJSDate(sunsetDT);
	return { sunrise, sunset };
}

async function main(): Promise<void> {
	// const speciesId = 408; //AMGO
	// const speciesId = 316; //junco
	const speciesId = 24; //DOWO
	const stationId = 11214; //nearby with decent history
	const minutes = 5;

	const location = { lat: 42.48, lon: -71.15 }; // very approx for now
	// API currently down - use fixed location for now
	// const stationInfo = await fetchStationInfo(config.birdWeather.apiBaseUrl, stationId);
	// const location = stationInfo.station.coords;
	void fetchStationInfo;
	void config;

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
		const timestamp = period.timestamp;
		const { dayOfYear, dayBucket } = dateTimeToBucket(timestamp);

		const tint = Math.floor((period.count / maxCount) * 255);
		const a = 255;
		const r = 255,
			b = 255 - tint,
			g = 255 - tint;

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

	// now loop through *days* in range to provide sunrise/set if we have a location:

	if (location) {
		const firstDateTime = withDates[0].timestamp;
		const lastDateTime = withDates[withDates.length - 1].timestamp;

		let timestamp = firstDateTime;
		do {
			timestamp = timestamp.plus({ day: 1 });
			const { sunrise, sunset } = getSunriseSunsetForDateTime(
				{ latitude: location.lat, longitude: location.lon },
				timestamp,
			);
			const { dayOfYear: sunriseDoy, dayBucket: sunriseBkt } = dateTimeToBucket(
				sunrise,
				scale,
			);
			plotPixelFromBottomLeft(
				myImageData,
				sunriseDoy * scale,
				sunriseBkt * scale,
				200,
				100,
				100,
				200,
			);

			const { dayOfYear: sunsetDoy, dayBucket: sunsetBkt } = dateTimeToBucket(
				sunset,
				scale,
			);
			plotPixelFromBottomLeft(
				myImageData,
				sunsetDoy * scale,
				sunsetBkt * scale,
				100,
				200,
				200,
				200,
			);

			console.log({ timestamp, sunriseDoy, sunriseBkt });
		} while (timestamp.toMillis() < lastDateTime.toMillis());
	}
	ctx.putImageData(myImageData, 0, 0);

	const fileData = myCanvas.toBuffer("image/png");
	const outpath = `${PROJECT_DIR}/tmp/yearHeatMap-station${stationId}-species${speciesId}.png`;
	console.log({ outpath });
	fs.writeFileSync(outpath, fileData);
}

main().finally(() => console.log("DONE"));
