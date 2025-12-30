import type { Canvas } from "canvas";
import { ChartImageBuilder, stepSizeForValueRange } from "./canvasChartBuilder";

type BarChartData = Record<string, number>;
type Offsets = { top: number; left: number; bottom: number; right: number };

class BarChart extends ChartImageBuilder {
	private chartData: BarChartData;
	private maxCount: number;

	private titleFontSize: number;
	private labelFontSize: number;
	private _footnote: string | undefined;

	constructor(
		canvasWidth: number,
		canvasHeight: number,
		title: string,
		chartData: BarChartData,
		chartOffsets: Offsets = { top: 50, left: 170, bottom: 40, right: 20 },
	) {
		super(canvasWidth, canvasHeight, title, chartOffsets);
		this.chartData = chartData;
		this.maxCount = Object.keys(this.chartData).reduce(
			(max, current) =>
				this.chartData[current] > max ? this.chartData[current] : max,
			0,
		);
		this.bgColor = "rgb(250,250,250)";
		this.fgColor = "rgb(255,255,255)";
		this.titleFontSize = Math.floor((1.5 * canvasWidth) / title.length);
		this.titleFont = `${this.titleFontSize}px Impact`;
		this.labelFontSize = Math.floor(canvasWidth / 50);
		this.labelFont = `${this.labelFontSize}px Impact`;

		console.log({
			titleFontSize: this.titleFontSize,
			labelFontSize: this.labelFontSize,
		});
	}

	get footnote(): string | undefined {
		return this._footnote;
	}

	set footnote(value: string) {
		this._footnote = value;
	}

	protected drawFootnote(): void {
		if (this.footnote) {
			console.log(`drawnote: ${this.footnote}`);
			const ctx = this.context2d;

			ctx.fillStyle = this.textColor;
			ctx.font = this.labelFont;

			const textMeasure = ctx.measureText(this.footnote);
			const textHeight =
				textMeasure.actualBoundingBoxAscent +
				textMeasure.actualBoundingBoxDescent;
			ctx.fillText(
				this.footnote,
				this.canvasWidth - textMeasure.width - this.graphOffset.right,
				textHeight + this.canvasHeight - this.graphOffset.bottom / 2,
			);
		}
	}

	drawGraph(): Canvas {
		this.drawTitleAndBackground();
		this.drawInnerFrame();
		if (this.footnote) {
			this.drawFootnote();
		}

		const ctx = this.context2d;

		const chartFrameStrokeWidth = 1;
		const padding = Math.ceil(this.labelFontSize / 4); // one side

		//barFullHeight includes one set of padding
		const barFullHeight =
			(this.graphHeight - padding - 2 * chartFrameStrokeWidth) /
			Object.keys(this.chartData).length;

		const barHeight = barFullHeight - padding;
		const barFillColor = "rgb(240,240,240)";
		const chartWidthScale =
			(this.graphWidth - padding * 2 - 2 * chartFrameStrokeWidth) /
			this.maxCount;

		let offset = 0;
		const barLeft = this.graphOffset.x + chartFrameStrokeWidth + padding;
		for (const species in this.chartData) {
			const songCount = this.chartData[species];
			const barWidth = songCount * chartWidthScale;
			const barTop =
				this.graphOffset.y +
				chartFrameStrokeWidth +
				offset * barFullHeight +
				padding;

			ctx.fillStyle = barFillColor;
			ctx.fillRect(barLeft, barTop, barWidth, barHeight);
			ctx.strokeStyle = "rgb(200,200,200)";
			ctx.strokeRect(barLeft, barTop, barWidth, barHeight);

			ctx.fillStyle = this.textColor;
			ctx.font = this.labelFont;
			const textMeasure = ctx.measureText(species);

			// label
			const baselineCoefficient = 2.7;
			ctx.fillText(
				species,
				this.graphOffset.x - textMeasure.width - padding,
				barTop + this.labelFontSize / baselineCoefficient + barHeight / 2,
			);

			// number
			ctx.fillText(
				`${songCount}`,
				barLeft + padding,
				barTop + this.labelFontSize / baselineCoefficient + barHeight / 2,
			);

			offset++;
		}

		// draw x-marks
		const maxSteps = 10;
		const stepSize = stepSizeForValueRange(this.maxCount, maxSteps);

		let step = 0;
		let label = 0;
		do {
			const labelString = `${label}`;
			const labelWidth = ctx.measureText(labelString).width;
			const markerPositionX =
				this.graphOffset.x +
				chartFrameStrokeWidth +
				padding +
				chartWidthScale * label;
			ctx.fillText(
				labelString,
				markerPositionX - labelWidth / 2,
				this.graphOffset.y + this.graphHeight + this.labelFontSize * 1.2,
			);

			ctx.strokeStyle = this.textColor;
			ctx.beginPath();
			ctx.moveTo(markerPositionX, this.graphOffset.y + this.graphHeight);
			ctx.lineTo(markerPositionX, this.graphOffset.y + this.graphHeight + 4);
			ctx.stroke();

			step++;
			label = step * stepSize;
		} while (label <= this.maxCount);
		return this.canvas;
	}
}

/**
 * Create barchart for given day's data as a PNG buffer
 *
 * @param dayData
 * @param dateString
 * @param width
 * @param height
 * @param offsets
 * @param note
 */
function drawChartFromDailySongData(
	dayData: { count: number; bird: string }[],
	dateString: string,
	width: number,
	height: number,
	offsets: Offsets,
	note?: string,
): Buffer {
	const chartData: BarChartData = {};
	for (const row of dayData) {
		chartData[row.bird] = row.count;
	}

	let title = `Calls and songs by species, ${dateString}`;
	if (note) {
		title = `${title}, ${note}`;
	}
	const chart = new BarChart(width, height, title, chartData, offsets);

	// if (note) {
	//   chart.footnote = note;
	// }
	chart.drawGraph();

	return chart.canvasAsPng();
}

export { drawChartFromDailySongData, BarChart };
export type { Offsets };
