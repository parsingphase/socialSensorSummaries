import { ChartImageBuilder, stepSizeForValueRange } from "./index";
// import { Canvas } from "canvas";
import * as PImage from "pureimage";

type BarChartData = Record<string, number>;

class BarChart extends ChartImageBuilder {
  private chartData: BarChartData;
  private maxCount: number;

  constructor(canvasWidth: number, canvasHeight: number, title: string, chartData: BarChartData) {
    super(canvasWidth, canvasHeight, title, { top: 50, left: 170, bottom: 40, right: 20 });
    this.chartData = chartData;
    this.maxCount = Object.keys(this.chartData).reduce(
      (max, current) => (this.chartData[current] > max ? this.chartData[current] : max),
      0
    );
    this.bgColor = "rgb(250,250,250)";
    this.fgColor = "rgb(255,255,255)";
    this.titleFont = "24px SourceSansPro";
    this.labelFont = "14px SourceSansPro";

    const fnt = PImage.registerFont(
      "data/fonts/SourceSansPro-Regular.ttf",
      "SourceSansPro",
    );
    fnt.loadSync();
  }

  drawGraph(): PImage.Bitmap {
    this.drawTitleAndBackground();
    this.drawInnerFrame();
    const ctx = this.context2d;

    const chartFrameStrokeWidth = 1;
    const padding = 4; // one side

    //barFullHeight includes one set of padding
    const barFullHeight =
      (this.graphHeight - padding - 2 * chartFrameStrokeWidth) / Object.keys(this.chartData).length;

    const barHeight = barFullHeight - padding;
    const barFillColor = "rgb(240,240,240)";
    const chartWidthScale =
      (this.graphWidth - padding * 2 - 2 * chartFrameStrokeWidth) / this.maxCount;

    let offset = 0;
    const barLeft = this.graphOffset.x + chartFrameStrokeWidth + padding;
    for (const species in this.chartData) {
      const songCount = this.chartData[species];
      const barWidth = songCount * chartWidthScale;
      const barTop = this.graphOffset.y + chartFrameStrokeWidth + offset * barFullHeight + padding;

      ctx.fillStyle = barFillColor;
      ctx.fillRect(barLeft, barTop, barWidth, barHeight);
      ctx.strokeStyle = "rgb(200,200,200)";
      ctx.strokeRect(barLeft, barTop, barWidth, barHeight);

      ctx.fillStyle = this.textColor;
      ctx.font = this.labelFont;
      const textMeasure = ctx.measureText(species);

      // label
      ctx.fillText(
        species,
        Math.round(this.graphOffset.x - textMeasure.width - padding),
        Math.round(barTop + 6 + barHeight / 2)
      );

      // number
      ctx.fillText("" + songCount, barLeft + padding, barTop + 6 + barHeight / 2);

      offset++;
    }

    // draw x-marks
    const maxSteps = 10;
    const stepSize = stepSizeForValueRange(this.maxCount, maxSteps);

    let step = 0;
    let label = 0;
    do {
      const labelString = "" + label;
      const labelWidth = ctx.measureText(labelString).width;
      const markerPositionX =
        this.graphOffset.x + chartFrameStrokeWidth + padding + chartWidthScale * label;
      ctx.fillText(
        labelString,
        markerPositionX - labelWidth / 2,
        this.graphOffset.y + this.graphHeight + 18
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
 */
export function drawChartFromDailySongData(
  dayData: { count: number; bird: string }[],
  dateString: string
): PImage.Bitmap {
  const rawData = dayData.slice(0, 10);

  const canvasWidth = 800;
  const canvasHeight = 500;
  const chartData: BarChartData = {};
  for (const row of rawData) {
    chartData[row.bird] = row.count;
  }

  const chart = new BarChart(
    canvasWidth,
    canvasHeight,
    `Calls and songs by species, ${dateString}`,
    chartData
  );
  return chart.drawGraph();

  // return chart.canvasAsPng();
}
