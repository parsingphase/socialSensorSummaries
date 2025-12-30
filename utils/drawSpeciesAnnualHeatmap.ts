#!/usr/bin/env tsx

import fs from "node:fs";
import { Command } from "@commander-js/extra-typings";
import { DateTime } from "luxon";
import { config } from "../config/config";
import type { BucketSpeciesObservationsQuery } from "../lib/birdWeather/codegen/graphql";
import { fetchSpeciesInfo, fetchStationInfo } from "../lib/birdWeather/fetch";
import type { Margins } from "../lib/charts/canvasChartBuilder";
import { HeatmapChart, type LatLon } from "../lib/charts/heatMapChart";
import { PROJECT_DIR } from "../lib/utils";
import { getSpeciesBucketCacheDirForSpeciesStationDuration } from "./shared";

type RawCachedBucketPeriod = { count: number; key: string };

type CachedBucketPeriodWithDateTime = RawCachedBucketPeriod & {
	timestamp: DateTime;
};

async function getOpts() {
	const program = new Command()
		.requiredOption("--stationId <number>", "Required, stationId to chart")
		.requiredOption("--speciesId <number>", "Required, speciesId to chart")
		.option(
			"--speciesName <number>",
			"Optional, looked up if from speciesId if missing",
		)
		.option(
			"--location <lat,lng>",
			"Optional, looked up if from stationId if missing",
		)
		.description("Data must be pre-cached with fetchBucketHistory.ts");

	program.parse();

	const options = program.opts(); // smart type
	const {
		stationId: stationIdString,
		speciesId: speciesIdString,
		location: stringLocation,
	} = options;
	const stationId = Number(stationIdString);
	const speciesId = Number(speciesIdString);

	const apiUrl = config.birdWeather.apiBaseUrl;
	let { speciesName } = options;
	let location: LatLon | null;
	if (stringLocation) {
		const [lat, lon] = stringLocation
			.split(/\s*,\s*/)
			.map((x) => parseFloat(x));
		location = { lat, lon };
	} else {
		const stationInfo = await fetchStationInfo(apiUrl, stationId);
		location = stationInfo.station.coords ?? null;
	}

	if (!speciesName) {
		const speciesInfo = await fetchSpeciesInfo(apiUrl, speciesId);
		speciesName = speciesInfo.species?.commonName;
	}
	return { stationId, speciesId, speciesName, location };
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
			"No cached data available. Run fetchBucketHistory.ts first",
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
	const { stationId, speciesId, speciesName, location } = await getOpts();
	const minutes = 5;
	const allData = loadSpeciesBucketCache(speciesId, stationId, minutes);

	const targetTimeZone = "America/New_York";
	const withDates = hydrateSpeciesBucketCacheDates(allData, targetTimeZone);
	const fileData = buildObservationHeatmap(
		speciesName ?? "",
		withDates,
		location || undefined,
	);

	const outpath = `${PROJECT_DIR}/tmp/yearHeatMap-station${stationId}-species${speciesId}.png`;
	console.log({ outpath });
	fs.writeFileSync(outpath, fileData);
}

main()
	.catch((e) => console.error(e.message ?? e))
	.finally(() => console.log("DONE"));
