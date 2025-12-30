import { inputToRGB } from "@ctrl/tinycolor";
import { type Canvas, DOMMatrix, type ImageData } from "canvas";
import { DateTime, Interval } from "luxon";
import SunCalc from "suncalc";
import { ChartImageBuilder, type Margins } from "./canvasChartBuilder";
import { dateToLeapYearDayOfYear } from "./lineChart";

type LatLon = {
	lat: number;
	lon: number;
};

type CountWithDateTime = {
	count: number;
	timestamp: DateTime;
};

class HeatmapChart extends ChartImageBuilder {
	protected plotscale: number;
	protected location: { lat: number; lon: number } | undefined;
	protected bucketData: CountWithDateTime[];

	constructor(
		canvasWidth: number,
		canvasHeight: number,
		title: string,
		graphFrame: Margins,
		plotScale: number,
		bucketData: CountWithDateTime[],
		location?: LatLon,
	) {
		super(canvasWidth, canvasHeight, title, graphFrame);
		this.plotscale = plotScale;
		this.location = location;
		this.bucketData = bucketData;

		this.labelFont = "16px Impact";
		this.fgColor = "rgb(250,250,250)";
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

		const scale = this.plotscale;

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
			const r = Math.round(bgColorRgb.r - (count / maxCount) * bgColorRgb.r);
			const g = Math.round(bgColorRgb.g - (count / maxCount) * bgColorRgb.g);
			const b = bgColorRgb.b;

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
			this.plotSunriseSunset(myImageData, withDates, location, scale);
		}
		ctx.putImageData(
			myImageData,
			this.graphOffset.x + 1,
			this.graphOffset.y + 1,
		);
		this.drawScale(maxCount, !!location);

		return this.canvas;
	}

	private plotSunriseSunset(
		myImageData: ImageData,
		intervals: CountWithDateTime[],
		location: LatLon,
		scale: number,
	) {
		const firstDateTime = intervals[0].timestamp;
		const lastDateTime = intervals[intervals.length - 1].timestamp;

		let timestamp = firstDateTime;
		do {
			timestamp = timestamp.plus({ day: 1 });
			const { sunrise, sunset } = getSunriseSunsetForDateTime(
				{ latitude: location.lat, longitude: location.lon },
				timestamp,
			);
			const { dayOfYear: sunriseDoy, dayBucket: sunriseBkt } = dateTimeToBucket(
				sunrise,
				scale,
			);

			const { r, g, b } = inputToRGB("rgb(220,120,90)");
			const a = 255;

			plotPixelFromBottomLeft(
				myImageData,
				sunriseDoy * scale,
				sunriseBkt * scale,
				r,
				g,
				b,
				a,
			);

			const { dayOfYear: sunsetDoy, dayBucket: sunsetBkt } = dateTimeToBucket(
				sunset,
				scale,
			);
			plotPixelFromBottomLeft(
				myImageData,
				sunsetDoy * scale,
				sunsetBkt * scale,
				r,
				g,
				b,
				a,
			);

			// console.log({ timestamp, sunriseDoy, sunriseBkt });
		} while (timestamp.toMillis() < lastDateTime.toMillis());
	}

	private drawScale(maxCount: number, withSunLines: boolean) {
		const ctx = this.context2d;

		ctx.fillStyle = this.textColor;
		ctx.font = this.labelFont;

		const footnote = `${withSunLines ? "Showing sunrise & sunset times. " : ""}Scale: 5 minute buckets, max count/bucket = ${maxCount}`;

		const textMeasure = ctx.measureText(footnote);
		const textHeight =
			textMeasure.actualBoundingBoxAscent +
			textMeasure.actualBoundingBoxDescent;
		ctx.fillText(
			footnote,
			this.canvasWidth - textMeasure.width - this.graphOffset.right,
			textHeight + this.canvasHeight - this.graphOffset.bottom / 2,
		);
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

export { HeatmapChart, type LatLon };
