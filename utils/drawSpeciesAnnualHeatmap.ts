#!/usr/bin/env tsx

import fs from "node:fs";
import { inputToRGB } from "@ctrl/tinycolor";
import { type Canvas, DOMMatrix, type ImageData } from "canvas";
import { DateTime, Interval } from "luxon";
import SunCalc from "suncalc";
import { config } from "../config/config";
import type { BucketSpeciesObservationsQuery } from "../lib/birdWeather/codegen/graphql";
import { fetchStationInfo } from "../lib/birdWeather/fetch";
import {
	ChartImageBuilder,
	type Margins,
} from "../lib/charts/canvasChartBuilder";
import { dateToLeapYearDayOfYear } from "../lib/charts/lineChart";
import { PROJECT_DIR } from "../lib/utils";
import { getSpeciesBucketCacheDirForSpeciesStationDuration } from "./shared";

type RawCachedBucketPeriod = { count: number; key: string };

type CachedBucketPeriodWithDateTime = RawCachedBucketPeriod & {
	timestamp: DateTime;
};

/**
 * Fetch all the data from a specific species/station cache set
 * @param speciesId
 * @param stationId
 * @param minutes
 */
function loadSpeciesBucketCache(
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

function hydrateSpeciesBucketCacheDates(
	allData: RawCachedBucketPeriod[],
	targetTimeZone: string,
): CachedBucketPeriodWithDateTime[] {
	return allData.map((d) => ({
		...d,
		timestamp: DateTime.fromISO(d.key, { zone: targetTimeZone }),
	}));
}

function plotPixelFromBottomLeft(
	myImageData: ImageData,
	x: number,
	y: number,
	r: number,
	g: number,
	b: number,
	a: number,
) {
	const pixelOffset = ((myImageData.height - y) * myImageData.width + x) * 4;

	myImageData.data[pixelOffset] = r;
	myImageData.data[pixelOffset + 1] = g;
	myImageData.data[pixelOffset + 2] = b;
	myImageData.data[pixelOffset + 3] = a;
}

function dateTimeToBucket(timestamp: DateTime, scale = 1) {
	const dayOfYear = Math.floor(
		Interval.fromDateTimes(timestamp.startOf("year"), timestamp).length("days"),
	);
	const minuteOfDay = Interval.fromDateTimes(
		timestamp.startOf("day"),
		timestamp,
	).length("minutes");

	const dayBucket = Math.floor((scale * minuteOfDay) / 5) / scale;
	return { dayOfYear, dayBucket };
}

function getSunriseSunsetForDateTime(
	location: {
		latitude: number;
		longitude: number;
	},
	timestamp: DateTime,
) {
	const { latitude, longitude } = location;
	const envTimes = SunCalc.getTimes(timestamp.toJSDate(), latitude, longitude);
	const { sunrise: sunriseDT, sunset: sunsetDT } = envTimes;

	const sunrise = DateTime.fromJSDate(sunriseDT);
	const sunset = DateTime.fromJSDate(sunsetDT);
	return { sunrise, sunset };
}

async function main(): Promise<void> {
	// const speciesId = 408; //AMGO
	// const speciesId = 316; //junco
	const speciesId = 24; //DOWO
	const speciesName = "Downy Woodpecker";
	const stationId = 11214; //nearby with decent history
	const minutes = 5;

	const location = { lat: 42.48, lon: -71.15 }; // very approx for now
	// API currently down - use fixed location for now
	// const stationInfo = await fetchStationInfo(config.birdWeather.apiBaseUrl, stationId);
	// const location = stationInfo.station.coords;
	void fetchStationInfo;
	void config;

	const allData = loadSpeciesBucketCache(speciesId, stationId, minutes);

	const targetTimeZone = "America/New_York";
	const withDates = hydrateSpeciesBucketCacheDates(allData, targetTimeZone);

	const width = 1200;
	const height = 800;
	// graph height = 2*12*24 = 576, width = 366 *2 = 732, plus 2 for border
	const margins: Margins = {
		top: 80,
		bottom: height - 80 - 576 - 2,
		left: 300,
		right: width - 300 - 732 - 2,
	};

	const chart = new HeatmapChart(
		width,
		height,
		`Annual Song Observations: ${speciesName}`,
		margins,
		withDates,
		location,
	);

	chart.drawGraph();
	const fileData = chart.canvasAsPng();

	const outpath = `${PROJECT_DIR}/tmp/yearHeatMap-station${stationId}-species${speciesId}.png`;
	console.log({ outpath });
	fs.writeFileSync(outpath, fileData);
}

type LatLon = {
	lat: number;
	lon: number;
};

class HeatmapChart extends ChartImageBuilder {
	protected location: { lat: number; lon: number } | undefined;
	protected bucketData: CachedBucketPeriodWithDateTime[];

	constructor(
		canvasWidth: number,
		canvasHeight: number,
		title: string,
		graphFrame: Margins,
		bucketData: CachedBucketPeriodWithDateTime[],
		location?: LatLon,
	) {
		super(canvasWidth, canvasHeight, title, graphFrame);
		this.location = location;
		this.bucketData = bucketData;

		this.labelFont = "16px Impact";
	}

	drawGraph(): Canvas {
		this.drawTitleAndBackground();
		this.drawInnerFrame();
		this.drawMonthLabels();
		this.drawHourLabels();

		// return this.canvas;

		const withDates = this.bucketData;

		const maxCount = withDates.reduce(
			(prevMax, currentValue) =>
				currentValue.count > prevMax ? currentValue.count : prevMax,
			0,
		);

		const scale = 2;

		const ctx = this.context2d;

		const width = 365 * scale;
		const height = 24 * 12 * scale;

		// get the drawn chart background as our plotting area for pixel data
		const myImageData = ctx.getImageData(
			this.graphOffset.x + 1,
			this.graphOffset.y + 1,
			width,
			height,
		);

		const bgColorRgb = inputToRGB(this.fgColor);

		for (const period of withDates) {
			const timestamp = period.timestamp;
			const { dayOfYear, dayBucket } = dateTimeToBucket(timestamp);

			// const tint = Math.floor((period.count / maxCount) * 255);
			const a = 255;
			const count = period.count;
			const r = bgColorRgb.r,
				b = Math.round(bgColorRgb.b - (count / maxCount) * bgColorRgb.b),
				g = Math.round(bgColorRgb.g - (count / maxCount) * bgColorRgb.g);

			// console.log({ timestamp, count, dayBucket, dayOfYear,r,g,b,a });

			for (let dx = 0; dx < scale; dx++) {
				for (let dy = 0; dy < scale; dy++) {
					plotPixelFromBottomLeft(
						myImageData,
						dayOfYear * scale + dx,
						dayBucket * scale + dy,
						r,
						g,
						b,
						a,
					);
				}
			}
		}

		// now loop through *days* in range to provide sunrise/set if we have a location:
		const location = this.location;
		if (location) {
			const firstDateTime = withDates[0].timestamp;
			const lastDateTime = withDates[withDates.length - 1].timestamp;

			let timestamp = firstDateTime;
			do {
				timestamp = timestamp.plus({ day: 1 });
				const { sunrise, sunset } = getSunriseSunsetForDateTime(
					{ latitude: location.lat, longitude: location.lon },
					timestamp,
				);
				const { dayOfYear: sunriseDoy, dayBucket: sunriseBkt } =
					dateTimeToBucket(sunrise, scale);
				plotPixelFromBottomLeft(
					myImageData,
					sunriseDoy * scale,
					sunriseBkt * scale,
					200,
					100,
					100,
					200,
				);

				const { dayOfYear: sunsetDoy, dayBucket: sunsetBkt } = dateTimeToBucket(
					sunset,
					scale,
				);
				plotPixelFromBottomLeft(
					myImageData,
					sunsetDoy * scale,
					sunsetBkt * scale,
					100,
					200,
					200,
					200,
				);

				// console.log({ timestamp, sunriseDoy, sunriseBkt });
			} while (timestamp.toMillis() < lastDateTime.toMillis());
		}
		ctx.putImageData(
			myImageData,
			this.graphOffset.x + 1,
			this.graphOffset.y + 1,
		);

		return this.canvas;
	}

	// (roughly) copied from class LineChart - FIXME create an intermediate inheriting class!
	private drawMonthLabels(): void {
		const ctx = this.context2d;
		ctx.font = this.labelFont;
		// any year will do, we'll us the one at coding time. Slight hack to use month 0 for last day of year
		for (let month = 0; month <= 12; month++) {
			const firstOfMonth = DateTime.local(2024, month, 1);
			const dayOfYear = dateToLeapYearDayOfYear(firstOfMonth);
			const label = month ? `- ${month}/1` : "- 12/31";
			ctx.translate(
				this.graphXtoCanvasX(month ? dayOfYear : 366) - 6, // subtract half label font height, allowing for hyphen midpoint
				this.graphYtoCanvasY(0) + 2,
			);
			ctx.rotate(Math.PI / 2);
			ctx.fillStyle = this.textColor;
			ctx.fillText(label, 0, 0);
			ctx.setTransform(new DOMMatrix([1, 0, 0, 1, 0, 0])); // counter rotate?
		}
	}

	private graphXtoCanvasX(x: number): number {
		const maxXValue = 366;
		return this.graphOffset.x + ((x + 0.5) / maxXValue) * this.graphWidth;
	}

	private graphYtoCanvasY(y: number): number {
		return (
			this.graphOffset.y +
			this.graphHeight -
			// (y / this.maxValue) * this.graphHeight
			(y / (24 * 2 * 12)) * this.graphHeight
		);
	}

	//end copied

	private drawHourLabels(): void {
		const ctx = this.context2d;
		ctx.font = this.labelFont;
		// any year will do, we'll us the one at coding time. Slight hack to use month 0 for last day of year
		ctx.fillStyle = this.textColor;

		for (let hour = 0; hour <= 24; hour += 2) {
			let label = `${hour === 24 ? 0 : hour}:00`;
			if (label.length === 4) {
				label = `0${label}`;
			}
			const fullLabel = `${label} -`;
			const textMeasure = ctx.measureText(fullLabel);

			const labelX = this.graphXtoCanvasX(0) - textMeasure.width - 4;
			const labelY =
				this.graphYtoCanvasY(hour * 12 * 2) +
				textMeasure.actualBoundingBoxAscent / 2 -
				1;
			ctx.fillText(fullLabel, labelX, labelY);
		}
	}
}

main().finally(() => console.log("DONE"));
