#!/usr/bin/env tsx

import fs from "node:fs";
import { Command } from "@commander-js/extra-typings";
import { DateTime } from "luxon";
import { initBirdWeatherClient } from "../lib/birdWeather/client";
import type {
	BucketSpeciesObservationsQuery,
	BucketSpeciesObservationsQueryVariables,
} from "../lib/birdWeather/codegen/graphql";
import { bucketObservationsQuery } from "../lib/birdWeather/queries";
import {
	getSpeciesBucketCacheDirForSpeciesStationDuration,
	getSpeciesBucketCacheRootDir,
} from "./shared";

function getOpts() {
	const program = new Command()
		.requiredOption("--stationId <number>", "Required, stationId to chart")
		.requiredOption("--speciesId <number>", "Required, speciesId to chart")
		.option("--weeks <number>", "Number of weeks of data to fetch", "52")
		.description(
			"Fetch BirdWeather bucket data to cache for heatmaps. Use searchSpecies.ts to look up IDs.",
		);

	program.parse();

	const options = program.opts(); // smart type
	const {
		stationId: stationIdString,
		speciesId: speciesIdString,
		weeks: weeksString,
	} = options;
	const stationId = Number(stationIdString);
	const speciesId = Number(speciesIdString);
	const weeks = Number(weeksString);

	return { stationId, speciesId, weeks };
}

async function main(): Promise<void> {
	const cacheRootDir = getSpeciesBucketCacheRootDir();
	fs.mkdirSync(cacheRootDir, { recursive: true });

	const client = initBirdWeatherClient();
	const today = DateTime.now();
	const startOfThisWeek = today.startOf("week");

	const { speciesId, stationId, weeks: weeksToCollect } = getOpts();

	for (let i = 0; i < weeksToCollect; i++) {
		const startOfWindow = startOfThisWeek.minus({ week: i + 1 });
		const endOfWindow = startOfThisWeek.minus({ week: i }).minus({ day: 1 });

		const fromDate = startOfWindow.toISODate();
		const bucketMinutes = 5;
		const variables: BucketSpeciesObservationsQueryVariables = {
			bucketMinutes,
			fromDate,
			toDate: endOfWindow.toISODate(),
			speciesId: `${speciesId}`,
			stationId: `${stationId}`,
		};
		const cacheFileDir = getSpeciesBucketCacheDirForSpeciesStationDuration(
			speciesId,
			stationId,
			bucketMinutes,
		);
		fs.mkdirSync(cacheFileDir, { recursive: true });
		const cacheFile = `${cacheFileDir}/from-${fromDate}.json`;

		// run synchronously, to avoid spike load
		const weekBuckets = await client.query<
			BucketSpeciesObservationsQuery,
			BucketSpeciesObservationsQueryVariables
		>({
			query: bucketObservationsQuery,
			variables,
		});

		fs.writeFileSync(cacheFile, JSON.stringify(weekBuckets.data, undefined, 2));
		console.log(`${i}: Write to ${cacheFile}`);
	}
}

main().finally(() => console.log("DONE"));
