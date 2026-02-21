#!/usr/bin/env tsx

import fs from "node:fs";
import { Command } from "@commander-js/extra-typings";
import { DateTime } from "luxon";
import { config } from "../config/config";
import {
	BucketPlotChart,
	type DatumWithDateTime,
} from "../lib/charts/annualBucketChart";
import type { Margins } from "../lib/charts/canvasChartBuilder";
import type { LatLon } from "../lib/charts/utils";
import { PROJECT_DIR } from "../lib/utils";
import { type AmbientDayRecord, loadCachedDailyData } from "../lib/weather";
import { getAmbientWeatherCacheDirForStation } from "./shared";

async function getOpts() {
	const program = new Command()
		.option("--location <lat,lng>", "Location of station for sunrise/set data")
		.option(
			"--timezone <tz>",
			"Timezone to calculate start/end of day",
			Intl.DateTimeFormat().resolvedOptions().timeZone,
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
	}

	return {
		location,
		timezone,
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
	location?: LatLon,
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
		`Temperatures`,
		margins,
		timedData,
	);

	if (location) {
		chart.setLocation(location);
	}

	chart.drawGraph();
	return chart.canvasAsPng();
}

async function main(): Promise<void> {
	const { location, timezone } = await getOpts();

	const ambientDayRecords = loadCachedDataByDay();
	const allData = ambientDayRecords.slice(
		Math.max(0, ambientDayRecords.length - 363),
	);

	let timedData: DatumWithDateTime[] = [];
	for (const allDayData of allData) {
		const timedTemps: DatumWithDateTime[] =
			allDayData.dayData
				?.filter((d) => "tempf" in d)
				.map((d) => {
					const t: DatumWithDateTime = {
						datum: d.tempf as number,
						timestamp: DateTime.fromMillis(d.dateutc, { zone: timezone }),
					};
					return t;
				}) ?? [];
		timedData = [...timedData, ...timedTemps];
	}

	const fileData = buildObservationHeatmap(timedData, location || undefined);

	const stationId = config.ambientWeather.deviceMac.replaceAll(":", "");

	const outpath = `${PROJECT_DIR}/tmp/yearHeatMap-station${stationId}-weather.png`;
	console.log({ outpath });
	fs.writeFileSync(outpath, fileData);
}

main()
	.catch((e) => console.error(e.message ?? e))
	.finally(() => console.log("DONE"));
