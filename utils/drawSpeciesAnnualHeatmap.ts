#!/usr/bin/env tsx

import fs from "node:fs";
import { DateTime } from "luxon";
import { config } from "../config/config";
import type { BucketSpeciesObservationsQuery } from "../lib/birdWeather/codegen/graphql";
import { fetchStationInfo } from "../lib/birdWeather/fetch";
import type { Margins } from "../lib/charts/canvasChartBuilder";
import { HeatmapChart } from "../lib/charts/heatMapChart";
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

function buildObservationHeatmap(
	speciesName: string,
	observations: CachedBucketPeriodWithDateTime[],
	location: {
		lat: number;
		lon: number;
	},
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

	chart.drawGraph();
	return chart.canvasAsPng();
}

async function main(): Promise<void> {
	// const speciesId = 408; //AMGO
	// const speciesId = 316; //junco
	const speciesId = 24; //DOWO
	const speciesName = "Downy Woodpecker";
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
	const fileData = buildObservationHeatmap(speciesName, withDates, location);

	const outpath = `${PROJECT_DIR}/tmp/yearHeatMap-station${stationId}-species${speciesId}.png`;
	console.log({ outpath });
	fs.writeFileSync(outpath, fileData);
}

main().finally(() => console.log("DONE"));
