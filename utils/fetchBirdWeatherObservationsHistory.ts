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
			DateTime.now().toISODate(),
		)
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
	} = options;
	const stationId = Number(stationIdString);
	const speciesId = Number(speciesIdString);
	const fromDate = DateTime.fromISO(fromDateString);
	const toDate = DateTime.fromISO(toDateString);

	if (!(fromDate.isValid && toDate.isValid)) {
		throw new Error("Invalid dates");
	}

	return { stationId, speciesId, fromDate, toDate };
}

async function main(): Promise<void> {
	const { speciesId, stationId, fromDate, toDate } = getOpts();
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
		const observations = await fetchSpeciesObservationsForDay(
			apiUrl,
			`${stationId}`,
			`${speciesId}`,
			dateOfInterest,
		);

		const cacheFile = `${dirForSpeciesStation}/${dateOfInterest}.json`;
		fs.writeFileSync(cacheFile, JSON.stringify(observations, undefined, 2));
		console.log(`${dateOfInterest}: Write to ${cacheFile}`);
	}
}

main().finally(() => console.log("DONE"));
