import { inputToRGB, TinyColor } from "@ctrl/tinycolor";
import { type Canvas, DOMMatrix, type ImageData } from "canvas";
import { DateTime, Interval } from "luxon";
import SunCalc from "suncalc";
import { ChartImageBuilder, type Margins } from "./canvasChartBuilder";
import { dateToLeapYearDayOfYear } from "./lineChart";
import { tinyColorToRgba255 } from "./tinyTools";

type LatLon = {
	lat: number;
	lon: number;
};

type CountWithDateTime = {
	count: number;
	timestamp: DateTime;
};

class HeatmapChart extends ChartImageBuilder {
	/**
	 * Edge length in pixels of the square plotting one time-bucket's data
	 * @protected
	 */
	protected plotScale: number;
	/**
	 * Lat-lon position of the station, used for sunrise/set if present
	 * @protected
	 */
	protected location: { lat: number; lon: number } | undefined;
	/**
	 * Data to plot (set via accessor in constructor)
	 * @protected
	 */
	protected bucketData: CountWithDateTime[] = [];

	protected bucketMax: number = 0;

	/**
	 * Plot color as string (mostly informational)
	 * @protected
	 */
	protected plotColorString: string = "rgb(0,0,255)";
	/**
	 * Color in object form as a parser cache. Set on construct or setter
	 * @protected
	 */
	protected plotColor: TinyColor;

	/**
	 * Power to raise values to when calculating color, to avoid swamping lower values
	 *
	 * Range of >0, ≤=1 (ie we're typically taking a root of some sort)
	 *
	 * @protected
	 */
	protected scalingPower: number = 1;

	protected fixedMax: number | false = false;

	// Chained setters for optional values
	public setLocation(location: LatLon): this {
		this.location = location;
		return this;
	}

	public setPlotColor(colorObjOrString: TinyColor | string): this {
		if (typeof colorObjOrString === "string") {
			this.plotColorString = colorObjOrString;
			this.plotColor = new TinyColor(colorObjOrString);
		} else {
			this.plotColor = colorObjOrString;
			this.plotColorString = `rgb(${colorObjOrString.r},${colorObjOrString.g},${colorObjOrString.b})`;
		}
		return this;
	}

	public setScalingPower(power: number): this {
		if (power <= 0 || power > 1) {
			throw new Error("Scaling power must be in range (0,1]");
		}
		this.scalingPower = power;
		return this;
	}

	public setFixedMax(max: number | false): this {
		if (max !== false && max < 1) {
			throw new Error("Fixed max must be at least 1 (or 'false' to unset)");
		}
		this.fixedMax = max;
		return this;
	}

	public setBucketData(bucketData: CountWithDateTime[]) {
		this.bucketData = bucketData;
		this.bucketMax = this.bucketData.reduce(
			(prevMax, currentValue) =>
				currentValue.count > prevMax ? currentValue.count : prevMax,
			0,
		);
		return this;
	}

	/**
	 * Create chart builder with required config
	 *
	 * @param canvasWidth
	 * @param canvasHeight
	 * @param title
	 * @param graphFrame Margins between image edge and graph plot
	 * @param plotScale Edge length in pixels of the square plotting one time-bucket's data
	 * @param bucketData Time-bucket data to plot
	 */
	constructor(
		canvasWidth: number,
		canvasHeight: number,
		title: string,
		graphFrame: Margins,
		plotScale: number,
		bucketData: CountWithDateTime[],
	) {
		super(canvasWidth, canvasHeight, title, graphFrame);
		this.plotScale = plotScale;
		this.setBucketData(bucketData);

		this.labelFont = "16px Impact";
		this.fgColor = "rgb(250,250,250)";

		// init - this is a with-default property, so use a setter to change it
		this.plotColor = new TinyColor(this.plotColorString);
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

		// NB: Alpha is 0…1 here but int(0…255) in ImageData

		for (const period of withDates) {
			const { dayOfYear, dayBucket } = dateTimeToBucket(period.timestamp);

			const { r, g, b, a } = tinyColorToRgba255(
				this.getColorForPlotValue(period.count),
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

	private drawScale() {
		const withSunLines = !!this.location;
		const ctx = this.context2d;

		ctx.fillStyle = this.textColor;
		ctx.font = this.labelFont;

		const footnote = `${withSunLines ? "Showing sunrise & sunset times. " : ""}Scale: 5 minute buckets, max count/bucket = ${this.trueScaleMax()}`;

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

	protected getColorForPlotValue(plotValue: number): TinyColor {
		const scaleTop = this.trueScaleMax();
		const clippedValue = Math.min(scaleTop, plotValue);
		const scalingPower = this.scalingPower;
		const opacity = clippedValue ** scalingPower / scaleTop ** scalingPower;
		return this.plotColor.clone().setAlpha(opacity).onBackground(this.bgColor);
	}

	protected trueScaleMax() {
		return this.fixedMax || this.bucketMax;
	}
}

/**
 * Color component number range is 0…255
 * @param myImageData
 * @param x
 * @param y
 * @param r
 * @param g
 * @param b
 * @param a
 */
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

	// console.log({ x, y, r, g, b, a });

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
