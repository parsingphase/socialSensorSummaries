import fs from "node:fs";
import { objectToQueryString } from "../utils";

/**
 * NB: this type is specific to my sensor setup
 *
 * See https://github.com/ambient-weather/api-docs/wiki/Device-Data-Specs for other options
 */
type AmbientWeatherInterval = {
	dateutc: number; // int, epochMs
	tempf: number; // float
	humidity: number; // int
	windspeedmph: number; // float
	windgustmph: number; // float
	maxdailygust: number; // float
	winddir: number; // int
	winddir_avg10m: number; // int
	uv: number; // int
	solarradiation: number; // float

	hourlyrainin: number; // float
	eventrainin: number; // float
	dailyrainin: number; // float
	weeklyrainin: number; // float
	monthlyrainin: number; // float
	yearlyrainin: number; // float
	totalrainin: number; // float

	tempinf: number; // float
	humidityin: number; // int
	baromrelin: number; // float
	baromabsin: number; // float
	battin: number; // int
	feelsLike: number; // float
	dewPoint: number; // float
	feelsLikein: number; // float
	dewPointin: number; // int

	lastRain: string; // ISO format "2025-01-01T12:40:00.000Z",
	date: string; // ISO format

	lightning_day: number; //int, count
	lightning_time: number; //int, epochMs
	lightning_distance: number; //float, miles
	lightning_hour: number; //int, count
};

type AmbientWeatherApiConfig = {
	apiBaseUrl: string;
	apiKey: string;
	applicationKey: string;
	deviceMac: string;
};

type AmbientWeatherApiDeviceQueryParams = {
	// Number of intervals to return. Interval is determined by API / user account level? (5 or 30 mins)
	// Default 228 (24 hrs of 5 minutes)
	limit?: number;
	// Date as milliseconds since epoch
	endDate?: string;
};

/**
 * Fetch data from AWN API per config
 * @param ambientWeatherConfig
 * @param queryParams
 */
async function fetchDeviceWeatherRecords(
	ambientWeatherConfig: AmbientWeatherApiConfig,
	queryParams: AmbientWeatherApiDeviceQueryParams,
): Promise<AmbientWeatherInterval[] | { error: string }> {
	const { apiBaseUrl, apiKey, applicationKey, deviceMac } =
		ambientWeatherConfig;
	const endpoint = "/v1/devices/";
	const queryUrl = `${apiBaseUrl}${endpoint}${deviceMac}?${objectToQueryString({
		...queryParams,
		apiKey,
		applicationKey,
	})}`;

	return await (await fetch(queryUrl)).json();
}

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

function getMaxMinFromDailyWeatherData(fileData: DayRecord) {
	const date = fileData.date;
	const intervals = fileData?.dayData || [];

	const minTemp = intervals.reduce<number | null>((acc, current) => {
		const m = current.tempf as number;
		if (m === undefined) {
			return acc;
		}
		return acc === null ? m : Math.min(acc, m);
	}, null);

	const maxTemp = intervals.reduce<number | null>((acc, current) => {
		const m = current.tempf as number;
		if (m === undefined) {
			return acc;
		}
		return acc === null ? m : Math.max(acc, m);
	}, null);
	return { date, minTemp, maxTemp };
}

export {
	fetchDeviceWeatherRecords,
	getMaxMinFromDailyWeatherData,
	loadCachedDailyData,
};
export type {
	AmbientWeatherInterval,
	AmbientWeatherApiConfig,
	AmbientWeatherApiDeviceQueryParams,
};
