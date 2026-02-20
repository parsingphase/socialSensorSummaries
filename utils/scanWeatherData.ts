#!/usr/bin/env npx tsx

import { config } from "../config/config";
import {
	getMaxMinFromDailyWeatherData,
	loadCachedDailyData,
} from "../lib/weather";
import { getAmbientWeatherCacheDirForStation } from "./shared";

function main(): void {
	const dirForSpeciesStation = getAmbientWeatherCacheDirForStation(
		config.ambientWeather.deviceMac,
	);
	const data = loadCachedDailyData(dirForSpeciesStation);

	const maxima: number[] = [];
	const minima: number[] = [];

	for (const fileData of data) {
		const { date, minTemp, maxTemp } = getMaxMinFromDailyWeatherData(fileData);

		if (minTemp !== null) {
			minima.push(minTemp);
		}

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
