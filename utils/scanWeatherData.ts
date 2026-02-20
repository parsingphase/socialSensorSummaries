#!/usr/bin/env npx tsx

import fs from "node:fs";
import { config } from "../config/config";
import { getAmbientWeatherCacheDirForStation } from "./shared";

/**
 * List all the dates for which we have data files, sorted
 *
 * @param dataDir
 */
function listDatesWithData(dataDir: string): string[] {
	const dirList = fs.readdirSync(dataDir);
	// console.log(JSON.stringify(dirList));
	const rawFiles = dirList
		.filter((f) => f.match(/^\d{4}-\d{2}-\d{2}/))
		.map((f) => f.split(".")[0]);
	rawFiles.sort();
	return rawFiles;
}

type AmbientRecord = Record<string, string | number>;

type DayRecord = { date: string; dayData: AmbientRecord[] | null };

/**
 * Fetch and parse a given day's file
 *
 * @param dataDir
 */
function loadCachedDailyData(dataDir: string): DayRecord[] {
	const dates = listDatesWithData(dataDir);

	const allData: DayRecord[] = [];
	// console.log(JSON.stringify(dates));
	for (const date of dates) {
		const dayData = JSON.parse(
			fs.readFileSync(`${dataDir}/${date}.json`, "utf-8"),
		) as AmbientRecord[] | null;
		allData.push({ date, dayData: dayData });
	}
	return allData;
}

function main(): void {
	const dirForSpeciesStation = getAmbientWeatherCacheDirForStation(
		config.ambientWeather.deviceMac,
	);
	const data = loadCachedDailyData(dirForSpeciesStation);

	const maxima: number[] = [];
	const minima: number[] = [];

	for (const fileData of data) {
		const date = fileData.date;
		const intervals = fileData?.dayData || [];

		const minTemp = intervals.reduce<number | null>((acc, current) => {
			const m = current.tempf as number;
			if (m === undefined) {
				return acc;
			}
			return acc === null ? m : Math.min(acc, m);
		}, null);

		if (minTemp !== null) {
			minima.push(minTemp);
		}

		const maxTemp = intervals.reduce<number | null>((acc, current) => {
			const m = current.tempf as number;
			if (m === undefined) {
				return acc;
			}
			return acc === null ? m : Math.max(acc, m);
		}, null);

		if (maxTemp !== null) {
			maxima.push(maxTemp);
		}

		console.log({ date, minTemp, maxTemp });
	}

	const min = Math.min(...minima);
	const max = Math.max(...maxima);

	console.log({ min, max });
	// { min: -4.7, max: 102.7 } (use range -10 to 110?)
}

main();
