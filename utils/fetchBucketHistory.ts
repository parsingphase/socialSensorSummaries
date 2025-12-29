#!/usr/bin/env tsx

import fs from "node:fs";
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

async function main(): Promise<void> {
	const cacheRootDir = getSpeciesBucketCacheRootDir();
	fs.mkdirSync(cacheRootDir, { recursive: true });

	const client = initBirdWeatherClient();
	const today = DateTime.now();
	const startOfThisWeek = today.startOf("week");

	const weeksToCollect = 8;
	const speciesId = 316; //junco
	const stationId = 11214; //nearby with decent history

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
