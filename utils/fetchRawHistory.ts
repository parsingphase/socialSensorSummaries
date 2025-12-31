#!/usr/bin/env npx tsx

// Fetch historic HaikuBox daily observation data to a local cache

import * as fs from "node:fs";
import { DateTime } from "luxon";
import { config } from "../config/config";
import { fetchDailyCount } from "../lib/haiku";

const start = DateTime.local(2023, 7, 15);
const outDir = `${__dirname}/rawHaikuData`;

/**
 * Sleep as a raw delay
 * @param ms
 */
async function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Run script
 */
async function main(): Promise<void> {
	const { serialNumber, apiBaseUrl: haikuBaseUrl } = config.haikubox;

	let day: DateTime = start;
	do {
		const when = day.toFormat("yyyy-MM-dd");
		console.log(when);
		const file = `${outDir}/${when}.json`;
		if (!fs.existsSync(file)) {
			const dayData = await fetchDailyCount(haikuBaseUrl, serialNumber, when);
			fs.writeFileSync(file, JSON.stringify(dayData, null, 2));
			await sleep(1000);
		}

		day = day.plus({ day: 1 });
	} while (day < DateTime.now().minus({ day: 1 }));
}

main().finally(() => console.log("DONE"));
