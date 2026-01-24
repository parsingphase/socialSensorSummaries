#!/usr/bin/env tsx

import fs from "node:fs";
import { Command } from "@commander-js/extra-typings";
import { DateTime } from "luxon";
import { config } from "../config/config";
import { fetchSpeciesObservationsForDay } from "../lib/birdWeather/fetch";
import { getSpeciesObservationCacheDirForSpeciesStation } from "./shared";

function getOpts() {
	const program = new Command()
		.requiredOption("--stationId <number>", "Required, stationId to chart")
		.requiredOption("--speciesId <number>", "Required, speciesId to chart")
		.option(
			"--from <yyyy-mm-dd>",
			"Start of range to fetch",
			DateTime.now().minus({ day: 7 }).toISODate(),
		)
		.option(
			"--to <yyyy-mm-dd>",
			"End of range to fetch",
			DateTime.now().minus({ day: 1 }).toISODate(),
		)
		.option("--no-skip-cached", "Refresh even cached files")
		.description(
			"Fetch BirdWeather bucket data to cache for heatmaps. Use searchSpecies.ts to look up IDs.",
		);

	program.parse();

	const options = program.opts(); // smart type
	const {
		stationId: stationIdString,
		speciesId: speciesIdString,
		from: fromDateString,
		to: toDateString,
		skipCached,
	} = options;
	const stationId = Number(stationIdString);
	const speciesId = Number(speciesIdString);
	const fromDate = DateTime.fromISO(fromDateString);
	const toDate = DateTime.fromISO(toDateString);

	if (!(fromDate.isValid && toDate.isValid)) {
		throw new Error("Invalid dates");
	}

	const processedOps = { stationId, speciesId, fromDate, toDate, skipCached };

	// console.log({processedOps});
	// process.exit();

	return processedOps;
}

async function main(): Promise<void> {
	const { speciesId, stationId, fromDate, toDate, skipCached } = getOpts();
	const dirForSpeciesStation = getSpeciesObservationCacheDirForSpeciesStation(
		speciesId,
		stationId,
	);
	fs.mkdirSync(dirForSpeciesStation, { recursive: true });

	const apiUrl = config.birdWeather.apiBaseUrl;

	// TODO: fetch all obs, paginated, day at a time.
	// Cache whole day's obs as one JSON file
	for (
		let day = toDate;
		day.toISODate() >= fromDate.toISODate();
		day = day.minus({ day: 1 })
	) {
		const dateOfInterest = day.toISODate();

		const cacheFile = `${dirForSpeciesStation}/${dateOfInterest}.json`;

		if (fs.existsSync(cacheFile) && skipCached) {
			console.info(`Skip cached file: ${dateOfInterest}.json`);
			continue;
		}

		const observations = await fetchSpeciesObservationsForDay(
			apiUrl,
			`${stationId}`,
			`${speciesId}`,
			dateOfInterest,
		);

		fs.writeFileSync(cacheFile, JSON.stringify(observations, undefined, 2));
		console.log(`${dateOfInterest}: Write to ${cacheFile}`);
	}
}

main().finally(() => console.log("DONE"));
