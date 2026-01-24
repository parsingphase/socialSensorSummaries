#!/usr/bin/env tsx

import fs from "node:fs";
import { Command } from "@commander-js/extra-typings";
import { DateTime } from "luxon";
import { config } from "../config/config";
import type { BucketSpeciesObservationsQuery } from "../lib/birdWeather/codegen/graphql";
import {
	fetchSpeciesInfo,
	fetchStationInfo,
	type ObservationRecord,
} from "../lib/birdWeather/fetch";
import type { Margins } from "../lib/charts/canvasChartBuilder";
import { HeatmapChart, type LatLon } from "../lib/charts/heatMapChart";
import { PROJECT_DIR } from "../lib/utils";
import {
	getSpeciesBucketCacheDirForSpeciesStationDuration,
	getSpeciesObservationCacheDirForSpeciesStation,
} from "./shared";

type RawCachedBucketPeriod = { count: number; key: string };

type CachedBucketPeriodWithDateTime = RawCachedBucketPeriod & {
	timestamp: DateTime;
};

async function getOpts() {
	const program = new Command()
		.requiredOption("--station-id <number>", "Required, stationId to chart")
		.requiredOption("--species-id <number>", "Required, speciesId to chart")
		.option(
			"--species-name <number>",
			"Optional, looked up if from speciesId if missing",
		)
		.option(
			"--location <lat,lng>",
			"Optional, looked up if from stationId if missing",
		)
		.option(
			"--timezone <tz>",
			"Timezone to calculate start/end of day",
			Intl.DateTimeFormat().resolvedOptions().timeZone,
		)
		.option(
			"--scaling-root <number>",
			"Scaling factor N to apply to chart counts, applied by scaling to Nth root of observation count. Try values from 1-3 (1 is unscaled)",
			"1",
		)
		.option(
			"--fixed-max <number>",
			"Set this value as max upper scale for comparable charts",
		)
		.description(
			"Data must be pre-cached with fetchBirdWeatherBucketHistory.ts\nFor a full list of timezones, see https://en.wikipedia.org/wiki/List_of_tz_database_time_zones",
		);

	program.parse();

	const options = program.opts(); // smart type
	const {
		stationId: stationIdString,
		speciesId: speciesIdString,
		location: stringLocation,
		timezone,
		scalingRoot: scalingRootString,
		fixedMax: fixedMaxString,
	} = options;
	const stationId = Number(stationIdString);
	const speciesId = Number(speciesIdString);
	const scalingRoot = Number(scalingRootString);
	const fixedMax = fixedMaxString ? Number(fixedMaxString) : undefined;

	const apiUrl = config.birdWeather.apiBaseUrl;
	let { speciesName } = options;
	let location: LatLon | null;
	if (stringLocation) {
		const [lat, lon] = stringLocation
			.split(/\s*,\s*/)
			.map((x) => parseFloat(x));
		location = { lat, lon };
	} else {
		try {
			const stationInfo = await fetchStationInfo(apiUrl, stationId);
			location = stationInfo.station.coords ?? null;
		} catch (e) {
			console.error("Error in fetchStationInfo");
			throw e;
		}
	}

	if (!speciesName) {
		try {
			const speciesInfo = await fetchSpeciesInfo(apiUrl, speciesId);
			speciesName = speciesInfo.species?.commonName;
		} catch (e) {
			console.error("Error in fetchSpeciesInfo");
			throw e;
		}
	}
	// console.log({ stationId, speciesId, speciesName, location, timezone, scalingRoot, fixedMax });
	return {
		stationId,
		speciesId,
		speciesName,
		location,
		timezone,
		scalingRoot,
		fixedMax,
	};
}

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

	if (!fs.existsSync(consistentFilesetRootDir)) {
		throw new Error(
			"No cached data available. Run fetchBirdWeatherBucketHistory.ts first",
		);
	}

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

void loadSpeciesBucketCache; // unused until API is fixed

function loadSpeciesCacheDataAsBuckets(
	speciesId: number,
	stationId: number,
	minutes: number,
): CachedBucketPeriodWithDateTime[] {
	const keyedBuckets: Record<string, CachedBucketPeriodWithDateTime> = {};
	const dirForSpeciesStation = getSpeciesObservationCacheDirForSpeciesStation(
		speciesId,
		stationId,
	);

	const files = fs.readdirSync(dirForSpeciesStation);
	for (const file of files) {
		if (file.endsWith(".json")) {
			const fileData = fs.readFileSync(`${dirForSpeciesStation}/${file}`, {
				encoding: "utf-8",
			});
			const records: ObservationRecord[] = JSON.parse(fileData);
			for (const record of records) {
				if (!record) {
					continue;
				}
				const timestamp = DateTime.fromISO(record.timestamp);
				const bucketFloor =
					Math.floor(timestamp.toMillis() / (60_000 * minutes)) *
					60_000 *
					minutes;
				const bucketTimestamp = DateTime.fromMillis(bucketFloor, {
					zone: timestamp.zone,
				});

				if (!bucketTimestamp.isValid) {
					throw new Error("bad ts");
				}

				const key = bucketTimestamp.toISO();

				if (!keyedBuckets[key]) {
					keyedBuckets[key] = {
						count: 0,
						key,
						timestamp: bucketTimestamp,
					};
				}
				keyedBuckets[key].count++;
			}
		}
	}

	return Object.values(keyedBuckets);
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

function buildObservationHeatmap(
	speciesName: string,
	observations: CachedBucketPeriodWithDateTime[],
	location?: LatLon,
	scalingPower = 1,
	fixedMax?: number,
): Buffer {
	const width = 1000;
	const height = 800;
	const plotScale = 2;
	const topMargin = 80;
	const plotHeight = plotScale * 12 * 24;
	const leftMargin = 160;
	const plotWidth = plotScale * 366;
	const margins: Margins = {
		top: topMargin,
		bottom: height - topMargin - plotHeight - 2,
		left: leftMargin,
		right: width - leftMargin - plotWidth - 2,
	};

	const chart = new HeatmapChart(
		width,
		height,
		`Annual Song Observations: ${speciesName}`,
		margins,
		plotScale,
		observations,
		location,
	);

	chart.drawGraph(scalingPower, fixedMax);
	return chart.canvasAsPng();
}

async function main(): Promise<void> {
	const {
		stationId,
		speciesId,
		speciesName,
		location,
		timezone,
		scalingRoot,
		fixedMax,
	} = await getOpts();

	const minutes = 5;
	// const allData = loadSpeciesBucketCache(speciesId, stationId, minutes);
	const allData = loadSpeciesCacheDataAsBuckets(speciesId, stationId, minutes);

	const withDates = hydrateSpeciesBucketCacheDates(allData, timezone);
	const fileData = buildObservationHeatmap(
		speciesName ?? "",
		withDates,
		location || undefined,
		1 / scalingRoot,
		fixedMax,
	);

	const scalingRootString = `${scalingRoot}`.replace(".", "_");
	const optMaxString = fixedMax ? `-mx${fixedMax}` : "";

	const outpath = `${PROJECT_DIR}/tmp/yearHeatMap-station${stationId}-species${speciesId}-sr${scalingRootString}${optMaxString}.png`;
	console.log({ outpath });
	fs.writeFileSync(outpath, fileData);
}

main()
	.catch((e) => console.error(e.message ?? e))
	.finally(() => console.log("DONE"));
