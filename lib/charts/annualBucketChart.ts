import { inputToRGB, type TinyColor } from "@ctrl/tinycolor";
import { type Canvas, DOMMatrix, type ImageData } from "canvas";
import { DateTime, Interval } from "luxon";
import SunCalc from "suncalc";
import tinygradient from "tinygradient";
import { ChartImageBuilder, type Margins } from "./canvasChartBuilder";
import { dateToLeapYearDayOfYear } from "./lineChart";
import { tinyColorToRgba255 } from "./tinyTools";
import { type LatLon, plotPixelFromBottomLeft } from "./utils";

// Copy of heatMapChart.ts - may be able to re-generalize once we've split out point logic.

type DatumWithDateTime = {
	datum: number;
	timestamp: DateTime;
};

class BucketPlotChart extends ChartImageBuilder {
	/**
	 * Lat-lon position of the station, used for sunrise/set if present
	 * @protected
	 */
	protected location: { lat: number; lon: number } | undefined;
	/**
	 * Data to plot (set via accessor in constructor)
	 * @protected
	 */
	protected bucketData: DatumWithDateTime[] = [];

	//NOTE: we're implying Fahrenheit here
	protected freezingPoint = 32;

	/**
	 * Cell square side for bucket
	 * @protected
	 */
	protected plotScale = 2;

	/**
	 * Max datapoint value in any bucket
	 * @protected
	 */
	protected maxDatum: number = 0;
	protected minDatum: number = 0;

	/**
	 * Color in object form as a parser cache. Set on construct or setter
	 * @protected
	 */
	protected colorGradient: tinygradient.Instance;

	// Chained setters for optional values
	public setLocation(location: LatLon): this {
		this.location = location;
		return this;
	}

	public setBucketData(bucketData: DatumWithDateTime[]) {
		this.bucketData = bucketData;

		const validData = bucketData
			.map((d) => d.datum)
			.filter((n) => n !== undefined && !Number.isNaN(n));
		this.maxDatum = Math.max(...validData);
		this.minDatum = Math.min(...validData);

		return this;
	}

	/**
	 * Create chart builder with required config
	 *
	 * @param canvasWidth
	 * @param canvasHeight
	 * @param title
	 * @param graphFrame Margins between image edge and graph plot
	 * @param bucketData Time-bucket data to plot
	 */
	constructor(
		canvasWidth: number,
		canvasHeight: number,
		title: string,
		graphFrame: Margins,
		bucketData: DatumWithDateTime[],
	) {
		super(canvasWidth, canvasHeight, title, graphFrame);
		this.setBucketData(bucketData);

		this.labelFont = "16px Impact";
		this.fgColor = "rgb(250,250,250)";

		// this will probably fail if the range doesn't cover freezing point AND the fixed mid-value?
		const plotColorSpec = [
			{ color: "rgb(0,0,240)", pos: 0 },
			{
				color: "rgb(60,180,240)",
				pos: this.valueAsScaleFraction(this.freezingPoint),
			},
			{ color: "rgb(60,200,60)", pos: this.valueAsScaleFraction(50) },
			{ color: "rgb(220,200,100)", pos: this.valueAsScaleFraction(70) },
			{ color: "rgb(240,0,0)", pos: 1 },
		];
		this.colorGradient = tinygradient(plotColorSpec);
	}

	/**
	 * Draw the chart, returning a canvas
	 */
	drawGraph(): Canvas {
		this.drawTitleAndBackground();
		this.drawInnerFrame();
		this.drawMonthLabels();
		this.drawHourLabels();

		const withDates = this.bucketData;

		const scale = this.plotScale;

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

		// NB: Alpha is 0…1 in TinyColor but int(0…255) in ImageData

		for (const period of withDates) {
			const { dayOfYear, dayBucket } = dateTimeToBucket(period.timestamp);

			const { r, g, b, a } = tinyColorToRgba255(
				this.getColorForPlotValue(period.datum),
			);

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
			// FIXME generate a clean list of days from period (or year?) start to end, else we only
			//  plot sun times for days where we have observations
			this.plotSunriseSunset(myImageData, withDates, location, scale);
		}
		ctx.putImageData(
			myImageData,
			this.graphOffset.x + 1,
			this.graphOffset.y + 1,
		);

		this.drawScale();

		return this.canvas;
	}

	private plotSunriseSunset(
		myImageData: ImageData,
		intervals: DatumWithDateTime[],
		location: LatLon,
		scale: number,
	) {
		const firstDateTime = intervals[0].timestamp;
		const lastDateTime = intervals[intervals.length - 1].timestamp;

		// console.log("plotSunriseSunset");
		// console.log({ firstDateTime, lastDateTime });

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

			const { r, g, b } = inputToRGB("rgb(0,0,0)");
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
		} while (timestamp.toMillis() < lastDateTime.toMillis());
	}

	private drawScale() {
		const withSunLines = !!this.location;
		const ctx = this.context2d;

		ctx.fillStyle = this.textColor;
		ctx.font = this.labelFont;

		const range = this.maxDatum - this.minDatum;

		const footnote = `${withSunLines ? "Showing sunrise & sunset times. " : ""}Scale: 5 minute buckets`;

		const textMeasure = ctx.measureText(footnote);
		const textHeight =
			textMeasure.actualBoundingBoxAscent +
			textMeasure.actualBoundingBoxDescent;
		const textBottom =
			textHeight + this.canvasHeight - this.graphOffset.bottom / 1.75;
		const textLeft =
			this.canvasWidth - textMeasure.width - this.graphOffset.right;
		ctx.fillText(footnote, textLeft, textBottom);

		const scaleTop = textBottom + this.graphOffset.bottom / 10;
		const scaleHeight = this.graphOffset.bottom / 5;

		const numScaleLegendElements = 7;
		const scaleLegendValues = [];
		const numIntervals = numScaleLegendElements - 1;
		for (let i = 0; i <= numIntervals; i++) {
			let legendValue = Math.round((i / numIntervals) * range + this.minDatum);

			if (Math.abs(legendValue - this.freezingPoint) < 5) {
				// make 32ºF a fixed value if there's a scale value nearby
				legendValue = this.freezingPoint;
			} else {
				legendValue = Math.round(legendValue / 5) * 5;
			}
			scaleLegendValues.push(legendValue);
		}

		const scaleElementWidth = this.graphWidth / (2 * numScaleLegendElements);
		const scaleLeft = this.graphOffset.x + this.graphWidth / 2;

		for (const [i, scaleValue] of scaleLegendValues.entries()) {
			const elementColor = this.getColorForPlotValue(scaleValue);
			ctx.fillStyle = elementColor.toRgbString();
			const textColor = elementColor.isDark()
				? "rgb(255,255,255)"
				: "rgb(0,0,0)";
			const elementLeft = scaleLeft + i * scaleElementWidth;
			ctx.fillRect(elementLeft, scaleTop, scaleElementWidth, scaleHeight);

			ctx.strokeStyle = this.fgColor;
			ctx.lineWidth = 1;
			ctx.strokeRect(elementLeft, scaleTop, scaleElementWidth, scaleHeight);

			ctx.fillStyle = textColor;
			ctx.font = this.labelFont;
			const elementText = `${scaleValue}ºF`;
			const measure = ctx.measureText(elementText);
			ctx.fillText(
				elementText,
				elementLeft + (scaleElementWidth - measure.width) / 2,
				scaleTop + (scaleHeight + measure.actualBoundingBoxAscent) / 2,
			);
		}
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

	/**
	 * Get color by linear combinations
	 *
	 * Note: To get color more like
	 * https://weatherspark.com/h/y/26197/2025/Historical-Weather-during-2025-in-Boston-Massachusetts-United-States#Figures-ColorTemperature,
	 * would need to use color rotation, not combination (probably https://tinycolor.vercel.app/docs/classes/TinyColor.html#spin.spin-1)
	 *
	 * Also consider: https://github.com/mistic100/tinygradient
	 *
	 * @param plotValue
	 * @protected
	 */
	protected getColorForPlotValue(plotValue: number): TinyColor {
		const fractionOfMaxRange = this.valueAsScaleFraction(plotValue);
		return this.colorGradient.hsvAt(fractionOfMaxRange);
	}

	private valueAsScaleFraction(plotValue: number) {
		// limit to 0…1 in case we call out-of-range, eg for scale ends
		return Math.max(
			0,
			Math.min(
				(plotValue - this.minDatum) / (this.maxDatum - this.minDatum),
				1,
			),
		);
	}
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

/**
 * Get sunrise and sunset times in the date and timezone of the passed timestamp
 * FIXME move to shared code
 *
 * @param location
 * @param timestamp
 */
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

	const sunrise = DateTime.fromJSDate(sunriseDT, { zone: timestamp.zone });
	const sunset = DateTime.fromJSDate(sunsetDT, { zone: timestamp.zone });
	return { sunrise, sunset };
}

export { BucketPlotChart };
export type { DatumWithDateTime };
