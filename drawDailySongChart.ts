#!/usr/bin/env npx tsx

import { ChartImageBuilder } from "./lib/charts";
import { Canvas } from "canvas";

type BarChartData = Record<string, number>;
class BarChart extends ChartImageBuilder {
  private chartData: BarChartData;
  private maxCount: number;

  constructor(canvasWidth: number, canvasHeight: number, title: string, chartData: BarChartData) {
    super(canvasWidth, canvasHeight, title, { top: 60, left: 60, bottom: 40, right: 40 });
    this.chartData = chartData;
    this.maxCount = Object.keys(this.chartData).reduce(
      (max, current) => (this.chartData[current] > max ? this.chartData[current] : max),
      0
    );
  }

  drawGraph(): Canvas {
    this.drawTitleAndBackground();
    this.drawInnerFrame();
    const ctx = this.context2d;

    const barFullHeight = this.graphHeight / 10;
    const barHeight = barFullHeight-4;

    let offset = 0;
    for (const species in this.chartData) {
      const barCount = this.chartData[species];
      const chartWidthScale = (this.graphWidth - 4) / this.maxCount;
      const barWidth = barCount * chartWidthScale;
      ctx.fillStyle = "rgb(255,0,0)";
      ctx.fillRect(
        this.graphOffset.x + 2,
        this.graphOffset.y + offset * barFullHeight + 2,
        barWidth,
        barHeight
      );

      offset++;
    }

    return this.canvas;
  }
}

/**
 * CLI payload - draw chart for one day's topX birds
 */
async function main(): Promise<void> {
  const dummyData = [
    {
      bird: "American Goldfinch",
      count: 286,
    },
    {
      bird: "Northern Cardinal",
      count: 272,
    },
    {
      bird: "Common Grackle",
      count: 172,
    },
    {
      bird: "Tufted Titmouse",
      count: 143,
    },
    {
      bird: "House Finch",
      count: 115,
    },
    {
      bird: "Carolina Wren",
      count: 89,
    },
    {
      bird: "Chipping Sparrow",
      count: 74,
    },
    {
      bird: "Mourning Dove",
      count: 59,
    },
  ];

  const canvasWidth = 800;
  const canvasHeight = 500;
  const chartData: BarChartData = {};
  for (const row of dummyData) {
    chartData[row.bird] = row.count;
  }

  const chart = new BarChart(canvasWidth, canvasHeight, "Top songs", chartData);
  chart.drawGraph();
  chart.writeToPng(__dirname + "/tmp/bar.png");
}

main().finally(() => console.log("DONE"));
