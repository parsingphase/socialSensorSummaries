#!/usr/bin/env npx ts-node --esm -r tsconfig-paths/register

import { aggregateAllDays, BirdRecord, DayRecord, loadCachedDailyData } from "./lib/haiku";
import { CanvasRenderingContext2D, createCanvas, DOMMatrix } from "canvas";
import fs from "fs";
import { DateTime } from "luxon";

const rawDir = `${__dirname}/rawHaikuData`;

type DatedCount = { bird: string; date: string; count: number | null };

type LineChartPoint = { columnLabel: string; count: number | null };

type Outage = {
  startDate: string;
  startPos: number;
  endDate: string;
  endPos: number;
};

/**
 * Create a rolling average of a dataset over a symmetric window
 *
 * @param data
 * @param window
 */
function smooth(data: LineChartPoint[], window: number): LineChartPoint[] {
  const reach = Math.floor(window / 2);
  const outData: LineChartPoint[] = [];
  for (let i = 0; i < data.length; i++) {
    const segment = data.slice(Math.max(i - reach, 0), Math.min(i + reach, data.length - 1));

    let total = 0;
    let dataPoints = 0;
    segment.forEach((s) => {
      if (s.count !== null) {
        total += s.count;
        dataPoints++;
      }
    });
    outData.push({
      columnLabel: data[i].columnLabel,
      count: total / dataPoints,
    });
  }
  return outData;
}

function stripNulls<T>(values: (T | null)[]): T[] {
  const numbers: T[] = [];
  values.forEach((d) => {
    if (d !== null) {
      numbers.push(d);
    }
  });
  return numbers;
}

class LineChart {
  protected canvasWidth: number;
  protected canvasHeight: number;
  protected graphOffset: { x: number; y: number };

  protected graphWidth: number;
  protected graphHeight: number;

  protected data: LineChartPoint[];
  protected maxValue: number;
  protected numValues: number;

  protected title: string;
  protected outages: Outage[];

  protected bgColor = "rgb(230,230,230)";
  protected fgColor = "rgb(245,245,230)";
  protected dataColor = "rgb(210,210,210)";
  protected avgColor = "rgb(63,63,127)";
  protected textColor = "rgb(0,0,0)";
  protected avgDash = [4, 4];
  protected titleFont = "20px Impact";
  protected labelFont = "12px Impact";

  constructor(
    canvasWidth: number,
    canvasHeight: number,
    data: LineChartPoint[],
    title: string,
    outages: Outage[] = []
  ) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.title = title;
    this.outages = outages;

    this.graphOffset = {
      x: 60,
      y: 60,
    };

    this.graphWidth = Math.floor(canvasWidth - 100);
    this.graphHeight = Math.floor(canvasHeight - 150);

    this.data = data;

    let values = data.map((d) => d.count);
    this.maxValue = Math.max(...stripNulls(values));
    this.numValues = data.length;
  }

  public writeToPng(filename: string) {
    const canvas = this.drawGraph();

    const fileData = canvas.toBuffer("image/png");
    fs.writeFileSync(filename, fileData);
  }

  private drawGraph() {
    const canvas = createCanvas(this.canvasWidth, this.canvasHeight);
    const ctx: CanvasRenderingContext2D = canvas.getContext("2d");

    ctx.fillStyle = this.bgColor;
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    ctx.fillStyle = this.textColor;
    ctx.font = this.titleFont;
    const textMeasure = ctx.measureText(this.title);
    ctx.fillText(this.title, (this.canvasWidth - textMeasure.width) / 2, 35);

    ctx.font = this.labelFont;
    this.drawValueLabels(ctx);

    ctx.fillStyle = this.fgColor;
    ctx.fillRect(this.graphOffset.x, this.graphOffset.y, this.graphWidth, this.graphHeight);

    const lineChartPoints = [...this.data];
    this.plotPoints(ctx, lineChartPoints, this.dataColor);
    this.plotPoints(ctx, smooth(lineChartPoints, 7), this.avgColor, this.avgDash);

    this.drawColumnLabels(10, lineChartPoints, ctx);

    for (const outage of this.outages) {
      ctx.fillStyle = this.bgColor;
      ctx.fillRect(
        this.graphXtoCanvasX(outage.startPos),
        this.graphYtoCanvasY(0) + 2,
        this.graphXtoCanvasX(outage.endPos) - this.graphXtoCanvasX(outage.startPos),
        this.graphYtoCanvasY(this.maxValue) - this.graphYtoCanvasY(0) - 2
      );
    }

    return canvas;
  }

  private drawValueLabels(ctx: CanvasRenderingContext2D) {
    const numSteps = 10;
    let stepSize = 1;
    let exponent = 0;

    stepGen: while (true) {
      let nextStep;
      for (const multiple of [1, 2, 5]) {
        nextStep = multiple * Math.pow(10, exponent);
        if (nextStep >= this.maxValue / numSteps) {
          break stepGen;
        }
        stepSize = nextStep;
      }
      exponent++;
    }

    let step = 0;
    let label = 0;
    do {
      const labelYPos = (label / this.maxValue) * this.graphHeight;
      const labelString = label.toString();
      const labelWidth = ctx.measureText(labelString).width;
      ctx.fillText(
        labelString,
        this.graphOffset.x - labelWidth - 10,
        this.graphOffset.y + this.graphHeight - labelYPos + 6
      );
      step++;
      label = step * stepSize;
    } while (label <= this.maxValue);
  }

  private drawColumnLabels(
    numColumLabels: number,
    lineChartPoints: LineChartPoint[],
    ctx: CanvasRenderingContext2D
  ) {
    for (let numerator = 0; numerator <= numColumLabels; numerator++) {
      // LHS date label
      const labelColumn = Math.floor((numerator * (lineChartPoints.length - 1)) / numColumLabels);
      ctx.translate(
        this.graphOffset.x + (labelColumn / this.data.length) * this.graphWidth,
        this.graphOffset.y + this.graphHeight + 10
      );
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = this.textColor;
      ctx.fillText(lineChartPoints[labelColumn].columnLabel, 0, 0);
      ctx.setTransform(new DOMMatrix([1, 0, 0, 1, 0, 0]));
    }
  }

  protected plotPoints(
    ctx: CanvasRenderingContext2D,
    lineChartPoints: LineChartPoint[],
    lineColor: string,
    dash: number[] = []
  ) {
    ctx.strokeStyle = lineColor;
    ctx.setLineDash(dash);
    // FIXME Find first, don't just check for zeroth being present
    const startDatum = lineChartPoints[0];
    if (startDatum && startDatum.count !== null) {
      // FIXME check should be by-point
      const startPoint = this.graphPointToCanvasXY(0, startDatum.count);

      ctx.beginPath();
      ctx.moveTo(startPoint.x, startPoint.y);
      for (let i = 1; i < lineChartPoints.length; i++) {
        const count = lineChartPoints[i].count;
        if (count !== null) {
          const nextPoint = this.graphPointToCanvasXY(i, count);
          ctx.lineTo(nextPoint.x, nextPoint.y);
        }
      }
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  private graphPointToCanvasXY(i: number, count: number) {
    return {
      x: this.graphXtoCanvasX(i),
      y: this.graphYtoCanvasY(count),
    };
  }

  private graphXtoCanvasX(x: number) {
    return this.graphOffset.x + ((x + 0.5) / this.numValues) * this.graphWidth;
  }

  private graphYtoCanvasY(y: number) {
    return this.graphOffset.y + this.graphHeight - (y / this.maxValue) * this.graphHeight;
  }
}

/**
 * Draw graph for a single species
 *
 * @param allData
 * @param targetSpecies
 * @param outFile
 * @param outages
 */
function drawSpeciesGraph(
  allData: DayRecord[],
  targetSpecies: string | null,
  outages: Outage[],
  outFile: string
) {
  const speciesDayCount: DatedCount[] = [];

  for (const dailyTotals of allData) {
    const { date, dayData } = dailyTotals;

    let count: number | null = null;
    if (dayData) {
      const speciesCount: BirdRecord[] = targetSpecies
        ? dayData.filter((d) => d.bird === targetSpecies)
        : dayData;
      count = speciesCount.length > 0 ? speciesCount[0].count : 0;
    } else {
      count = null;
    }
    const dateRecord: DatedCount = {
      bird: targetSpecies || "All",
      date,
      count,
    };
    speciesDayCount.push(dateRecord);
  }

  const data = speciesDayCount.map((d) => {
    const datum: LineChartPoint = { columnLabel: d.date, count: d.count };
    return datum;
  });

  const graph = new LineChart(800, 600, data, targetSpecies || "All species", outages);
  graph.writeToPng(outFile);

  console.log(`Wrote ${data.length} points to ${outFile}`);
}

/**
 * Run script
 */
function main(): void {
  const targetSpecies = process.argv[2];
  const allData = loadCachedDailyData(rawDir);
  const aggregate = aggregateAllDays(allData, 1, 10);
  // const aggregate = aggregateAllDays(allData, 1, 1000);

  let drawSpecies: string[] = [];
  if (targetSpecies) {
    drawSpecies = [targetSpecies];
  } else {
    drawSpecies = aggregate.map((a) => a.bird);
  }

  // calculate outages
  const outages: Outage[] = [];

  for (let i = 0; i < allData.length; i++) {
    const dailyTotals = allData[i];
    const { date, dayData } = dailyTotals;
    if (!dayData) {
      const yesterday = DateTime.fromFormat(date, "yyyy-MM-dd")
        .minus({ day: 1 })
        .toFormat("yyyy-MM-dd");
      const ongoingOutage = outages.find((o) => o.endDate == yesterday);
      if (ongoingOutage) {
        ongoingOutage.endDate = date;
        ongoingOutage.endPos = i;
      } else {
        outages.push({
          startDate: date,
          startPos: i,
          endDate: date,
          endPos: i,
        });
      }
    }
  }

  function outPathForSpecies(species: string, speciesCount: number) {
    return `${__dirname}/tmp/${species} (${speciesCount}).png`;
  }

  // we want an ordered list of [ { bird: SPECIES, date: YYYY-MM-DD, count: number }]
  for (const species of drawSpecies) {
    const speciesCount = aggregate.find((a) => a.bird == species)?.count || 0;
    if (speciesCount >= 1) {
      const outFile = outPathForSpecies(species, speciesCount);
      drawSpeciesGraph(allData, species, outages, outFile);
    }
  }
  let countAll = 0;
  aggregate.forEach((a) => (countAll += a.count));
  drawSpeciesGraph(allData, null, outages, outPathForSpecies("All species", countAll));
}

main();
