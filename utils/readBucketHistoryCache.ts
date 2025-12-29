#!/usr/bin/env tsx

import fs from "node:fs";
import type { BucketSpeciesObservationsQuery } from "../lib/birdWeather/codegen/graphql";
import { getSpeciesBucketCacheDirForSpeciesStationDuration } from "./shared";

type RawCachedBucketPeriod = { count: number; key: string };

/**
 * Fetch all the data from a specific species/station cache set
 * @param speciesId
 * @param stationId
 * @param minutes
 */
function hydrateSpeciesBucketCache(
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

async function main(): Promise<void> {
	const speciesId = 316; //junco
	const stationId = 11214; //nearby with decent history
	const minutes = 5;

	const allData = hydrateSpeciesBucketCache(speciesId, stationId, minutes);

	void allData;

	console.log(JSON.stringify(allData, undefined, 2));
}

main().finally(() => console.log("DONE"));
