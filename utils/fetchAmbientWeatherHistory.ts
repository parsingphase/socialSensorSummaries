#!/usr/bin/env tsx

import fs from "node:fs";
import { Command } from "@commander-js/extra-typings";
import { DateTime } from "luxon";
import { config } from "../config/config";
import { fetchDeviceWeatherRecords } from "../lib/weather";
import { getAmbientWeatherCacheDirForStation } from "./shared";

function getOpts() {
	const program = new Command()
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
	const { from: fromDateString, to: toDateString, skipCached } = options;
	const fromDate = DateTime.fromISO(fromDateString);
	const toDate = DateTime.fromISO(toDateString);

	if (!(fromDate.isValid && toDate.isValid)) {
		throw new Error("Invalid dates");
	}

	const processedOps = { fromDate, toDate, skipCached };

	// console.log({processedOps});
	// process.exit();

	return processedOps;
}

async function main(): Promise<void> {
	const { fromDate, toDate, skipCached } = getOpts();
	const dirForSpeciesStation = getAmbientWeatherCacheDirForStation(
		config.ambientWeather.deviceMac,
	);
	fs.mkdirSync(dirForSpeciesStation, { recursive: true });

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
		const startOfNextDay = day
			.plus({ day: 1 })
			.setZone("US/Eastern")
			.startOf("day");
		const midnightMs = `${startOfNextDay.toUnixInteger()}000`;
		const observations = await fetchDeviceWeatherRecords(
			config.ambientWeather,
			{ limit: (60 / 5) * 24, endDate: midnightMs },
		);

		if ("error" in observations) {
			throw new Error(observations.error);
		}
		await new Promise((resolve) => setTimeout(() => resolve(true), 1000));

		fs.writeFileSync(cacheFile, JSON.stringify(observations, undefined, 2));
		console.log(`${dateOfInterest}: Write to ${cacheFile}`);
	}
}

main().finally(() => console.log("DONE"));
