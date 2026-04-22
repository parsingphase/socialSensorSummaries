#!/usr/bin/env tsx

import fs from "node:fs";
import { Command } from "@commander-js/extra-typings";
import { DateTime, Interval } from "luxon";
import { config } from "../config/config";
import {
	BucketPlotChart,
	type ColorScaleSpec,
	type DatumWithDateTime,
} from "../lib/charts/annualBucketChart";
import type { Margins } from "../lib/charts/canvasChartBuilder";
import type { LatLon } from "../lib/charts/utils";
import { PROJECT_DIR } from "../lib/utils";
import {
	type AmbientDayRecord,
	type AmbientWeatherInterval,
	loadCachedDailyData,
} from "../lib/weather";
import { getAmbientWeatherCacheDirForStation } from "./shared";

async function getOpts() {
	const program = new Command()
		.option("--location <lat,lng>", "Location of station for sunrise/set data")
		.option(
			"--timezone <tz>",
			"Timezone to calculate start/end of day",
			Intl.DateTimeFormat().resolvedOptions().timeZone,
		)
		.option(
			"--from <yyyy-mm-dd>",
			"Start of chart range",
			DateTime.now().minus({ day: 362 }).toISODate(),
		)
		.option(
			"--to <yyyy-mm-dd>",
			"End of chart range",
			DateTime.now().minus({ day: 1 }).toISODate(),
		)
		.description(
			"Data must be pre-cached with fetchAmbientWeatherHistory.ts\nFor a full list of timezones, see https://en.wikipedia.org/wiki/List_of_tz_database_time_zones",
		);

	program.parse();

	const options = program.opts(); // smart type
	const { location: stringLocation, timezone } = options;

	let location: LatLon | null = null;
	if (stringLocation) {
		const [lat, lon] = stringLocation
			.split(/\s*,\s*/)
			.map((x) => parseFloat(x));
		location = { lat, lon };
	} else {
		location = config.location
			? {
					lat: config.location.latitude,
					lon: config.location.longitude,
				}
			: null;
	}
	const { from: fromDateString, to: toDateString } = options;
	const fromDate = DateTime.fromISO(fromDateString);
	const toDate = DateTime.fromISO(toDateString);

	if (!fromDate.isValid || !toDate.isValid) {
		throw new Error("Invalid date");
	}

	return {
		location,
		timezone,
		fromDate,
		toDate,
	};
}

/**
 * Fetch all the data from a specific species/station cache set
 */
function loadCachedDataByDay(): AmbientDayRecord[] {
	const consistentFilesetRootDir = getAmbientWeatherCacheDirForStation(
		config.ambientWeather.deviceMac,
	);

	if (!fs.existsSync(consistentFilesetRootDir)) {
		throw new Error(
			"No cached data available. Run fetchAmbientWeatherHistory.ts first",
		);
	}

	return loadCachedDailyData(consistentFilesetRootDir);
}

function buildObservationHeatmap(
	timedData: DatumWithDateTime[],
	titlePrefix: string,
	unit: string,
	location?: LatLon,
	freezeValue?: number,
	colorScale?: ColorScaleSpec,
	scalingPower = 1,
): Buffer {
	const width = 1000;
	const height = 800;
	const plotScale = 2;
	const topMargin = 80;
	const plotHeight = plotScale * 12 * 24;
	const leftMargin = 160;
	const plotWidth = plotScale * 366;
	const margins: Margins = {
		top: topMargin,
		bottom: height - topMargin - plotHeight - 2,
		left: leftMargin,
		right: width - leftMargin - plotWidth - 2,
	};

	const chart = new BucketPlotChart(
		width,
		height,
		`${titlePrefix}, ${timedData[0].timestamp.toISODate()} - ${timedData[timedData.length - 1].timestamp.toISODate()}`,
		margins,
		timedData,
		unit,
		colorScale,
	);

	if (location) {
		chart.setLocation(location);
	}

	if (freezeValue !== undefined) {
		chart.setFreezingPoint(freezeValue);
	}

	if (scalingPower) {
		chart.setScalingPower(scalingPower);
	}

	chart.drawGraph();
	return chart.canvasAsPng();
}

async function main(): Promise<void> {
	const opts = await getOpts();
	const { fromDate, toDate, location, timezone } = opts;
	const targetInterval = Interval.fromDateTimes(
		fromDate.startOf("day"),
		toDate.endOf("day"),
	);
	// console.log({ opts, targetInterval });

	const allData = loadCachedDataByDay();

	/************************** PICK INPUT FIELD **********************/
	// FIXME make this CLI config
	// const fieldOfInterest: keyof AmbientWeatherInterval = "baromabsin";
	// const titlePrefix = "Pressure";
	// const unit = "inHg";
	// const freezeValue = undefined;

	const fieldOfInterest: keyof AmbientWeatherInterval = "tempf";
	const titlePrefix = "Temperature";
	const unit = "ºF";
	const freezeValue = 32;

	// const fieldOfInterest: keyof AmbientWeatherInterval = "feelsLike";
	// const titlePrefix = "Temperature (feels like)";
	// const unit = "ºF";
	// const freezeValue = 32;
	//
	const colorScale: ColorScaleSpec = [
		{ color: "rgb(0,0,240)", pos: 0 },
		{
			color: "rgb(60,180,240)",
			value: freezeValue,
		},
		{
			color: "rgb(60,200,60)",
			value: 50,
		},
		{
			color: "rgb(220,200,100)",
			value: 70,
		},
		{ color: "rgb(240,0,0)", pos: 1 },
	];

	const scalingPower = 1;

	// FIXME 50,70 in default scale cause odd (but aesthetic) effects
	// Notes for designing future scale: lots under 200, little over 800, max 1200
	// - could also use a power scale
	// const fieldOfInterest: keyof AmbientWeatherInterval = "solarradiation";
	// const titlePrefix = "Insolation";
	// const unit = "W/m²";
	// const freezeValue = undefined;
	// const scalingPower = 0.5;

	// NB: actually works pretty well in negative (default scale)
	// const colorScale: ColorScaleSpec = [
	// 	{ color: "rgb(0,0,0)", pos: 0 },
	// 	{ color: "rgb(255,255,255)", pos: 1 },
	// ];
	//
	// const fieldOfInterest: keyof AmbientWeatherInterval = "windspeedmph";
	// const titlePrefix = "Wind speed";
	// const unit = "mph";
	// const freezeValue = undefined;
	// const scalingPower = 0.5;

	// also needs a power scale
	// const fieldOfInterest: keyof AmbientWeatherInterval = "hourlyrainin";
	// const titlePrefix = "Rain (hourly)";
	// const unit = "in";
	// const freezeValue = undefined;

	// const fieldOfInterest: keyof AmbientWeatherInterval = "aqi_pm25";
	// const titlePrefix = "AQI (PM25)";
	// const unit = "";
	// const freezeValue = undefined;
	// const colorScale: ColorScaleSpec = [
	// 	{ color: "rgb(230,230,255)", pos: 0 },
	// 	// { color: "rgb(220,220,220)", pos: 0.5 },
	// 	{ color: "rgb(160,160,160)", pos: 1 },
	// ];
	// const scalingPower=0.5

	let timedData: DatumWithDateTime[] = [];
	for (const allDayData of allData) {
		const timedTemps: DatumWithDateTime[] =
			allDayData.dayData
				?.filter((d) => fieldOfInterest in d)
				.map((d) => {
					const t: DatumWithDateTime = {
						datum: d[fieldOfInterest] as number,
						timestamp: DateTime.fromMillis(d.dateutc, { zone: timezone }),
					};
					return t;
				}) ?? [];
		timedData = [...timedData, ...timedTemps];
	}

	const timedDataInRange = timedData.filter((d) =>
		targetInterval.contains(d.timestamp),
	);

	timedDataInRange.sort(
		(a, b) => a.timestamp.toMillis() - b.timestamp.toMillis(),
	);

	const fileData = buildObservationHeatmap(
		timedDataInRange,
		titlePrefix,
		unit,
		location || undefined,
		freezeValue,
		colorScale,
		scalingPower,
	);

	// console.log(timedDataInRange.length)

	const stationId = config.ambientWeather.deviceMac.replaceAll(":", "");

	const outpath = `${PROJECT_DIR}/tmp/yearHeatMap-station${stationId}-${fieldOfInterest}-sp${scalingPower.toString().replace(".", "_")}-weather-${timedDataInRange[0].timestamp.toISODate()}-${timedDataInRange[timedDataInRange.length - 1].timestamp.toISODate()}.png`;
	console.log({ outpath });
	fs.writeFileSync(outpath, fileData);
}

main()
	.catch((e) => console.error(e))
	.finally(() => console.log("DONE"));
