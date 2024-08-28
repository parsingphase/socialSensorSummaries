#!/usr/bin/env npx tsx -r tsconfig-paths/register

import { aggregateAllDays, BirdRecord, DayRecord, loadCachedDailyData } from "./lib/haiku";
import { CanvasRenderingContext2D, createCanvas, DOMMatrix } from "canvas";
import fs from "fs";
import { DateTime, Interval } from "luxon";
import { TinyColor } from "@ctrl/tinycolor";

const rawDir = `${__dirname}/rawHaikuData`;
const HAIKU_DATE_FORMAT = "yyyy-MM-dd";

type DatedCount = { bird: string; date: string; count: number | null };

type LineChartPoint = { date: string; xIndex: number; count: number };

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
function smoothCount<T extends { count: number | null }>(data: T[], window: number): T[] {
  const reach = Math.floor(window / 2); // how far each side?
  const outData = [...data];
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

    if (outData[i].count !== null) {
      // leave nulls unchanged as we can't plot them
      outData[i].count = total / dataPoints;
    }
  }
  return outData;
}

/**
 * Filter out nulls.
 *
 * Raw array.filter() doesn't return types well
 * @param values
 */
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

  protected dailyData: MultiYearData;
  protected smoothData: MultiYearData;
  protected maxValue: number;

  protected title: string;
  protected outages: Outage[];

  protected bgColor = "rgb(230,230,230)";
  protected fgColor = "rgb(245,245,230)";
  protected textColor = "rgb(0,0,0)";
  protected titleFont = "20px Impact";
  protected labelFont = "12px Impact";

  protected legendBarLength = 60;

  constructor(
    canvasWidth: number,
    canvasHeight: number,
    speciesData: DatedCount[],
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
    this.maxValue = Math.max(...stripNulls(speciesData.map((s) => s.count)));
    this.dailyData = this.mapDataToYears(speciesData);
    this.smoothData = this.mapDataToYears(smoothCount<DatedCount>(speciesData, 7));
  }

  private mapDataToYears(speciesData: DatedCount[]): MultiYearData {
    const dataByYear: MultiYearData = {};

    for (const d of speciesData) {
      if (d.count !== null) {
        const dateObject = DateTime.fromFormat(d.date, HAIKU_DATE_FORMAT);
        const year = dateObject.year;
        const dayOfYear = dateToLeapYearDayOfYear(dateObject);
        const datum: LineChartPoint = { date: d.date, count: d.count, xIndex: dayOfYear };
        if (!dataByYear[year]) {
          dataByYear[year] = [];
        }
        dataByYear[year].push(datum);
      }
    }
    return dataByYear;
  }

  public writeToPng(filename: string) {
    const canvas = this.drawGraph();

    const fileData = canvas.toBuffer("image/png");
    fs.writeFileSync(filename, fileData);
  }

  private drawGraph() {
    // Setup key context
    const canvas = createCanvas(this.canvasWidth, this.canvasHeight);
    const ctx: CanvasRenderingContext2D = canvas.getContext("2d");

    // Set core colors, fonts
    ctx.fillStyle = this.bgColor;
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    ctx.fillStyle = this.textColor;
    ctx.font = this.titleFont;
    const textMeasure = ctx.measureText(this.title);
    ctx.fillText(this.title, (this.canvasWidth - textMeasure.width) / 2, 35);

    // Draw y-labels
    ctx.font = this.labelFont;
    this.drawValueLabels(ctx);

    ctx.fillStyle = this.fgColor;
    ctx.fillRect(this.graphOffset.x, this.graphOffset.y, this.graphWidth, this.graphHeight);
    ctx.strokeStyle = "rgb(100,100,100)";
    ctx.lineWidth = 1;
    ctx.strokeRect(this.graphOffset.x, this.graphOffset.y, this.graphWidth, this.graphHeight);

    const years = Object.keys(this.dailyData);

    // TODO build color array dynamically, draw averages with higher gamma & wider
    // For now, manually set base colors until we add a color-theory based library for harmonious colors
    const colors = ["rgb(100,150,220)", "rgb(100,200,100)"].map((c) => new TinyColor(c));

    // Draw data
    for (let i = 0; i < years.length; i++) {
      const year = years[i];

      const lineColor = new TinyColor(colors[i].toRgbString()).setAlpha(0.4);
      const avgColor = new TinyColor(colors[i].toRgbString()).brighten(10).setAlpha(0.6);

      ctx.lineWidth = 5;
      this.plotPoints(ctx, this.smoothData[year], avgColor.toRgbString());
      ctx.lineWidth = 1;
      this.plotPoints(ctx, this.dailyData[year], lineColor.toRgbString());

      // draw legend
      const yearLegendLeft =
        this.graphOffset.x + (i * (this.graphWidth - this.graphOffset.x * 2)) / years.length;

      ctx.fillStyle = "black";
      let ybase = 44;
      ctx.fillText(year, yearLegendLeft, this.canvasHeight - ybase);

      ctx.lineWidth = 1;
      ctx.strokeStyle = lineColor.toRgbString();
      ctx.beginPath();
      ybase = 32;
      ctx.moveTo(yearLegendLeft, this.canvasHeight - ybase);
      ctx.lineTo(yearLegendLeft + this.legendBarLength, this.canvasHeight - ybase);
      ctx.stroke();

      ctx.fillText(
        "daily",
        yearLegendLeft + this.legendBarLength + 5,
        this.canvasHeight - ybase + 3
      );

      ybase = 16;
      ctx.lineWidth = 5;
      ctx.strokeStyle = avgColor.toRgbString();
      ctx.beginPath();
      ctx.moveTo(yearLegendLeft, this.canvasHeight - ybase);
      ctx.lineTo(yearLegendLeft + this.legendBarLength, this.canvasHeight - ybase);
      ctx.stroke();

      ctx.fillText(
        "7d avg",
        yearLegendLeft + this.legendBarLength + 5,
        this.canvasHeight - ybase + 3
      );
    }
    this.drawMonthLabels(ctx);

    // Draw any outage gaps
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

  /**
   * Draw y-axis ticks, auto-scaled
   * @param ctx
   * @private
   */
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
      const labelString = label.toString() + " -";
      const labelWidth = ctx.measureText(labelString).width;
      ctx.fillText(
        labelString,
        this.graphOffset.x - labelWidth - 2,
        this.graphOffset.y + this.graphHeight - labelYPos + 2
      );
      step++;
      label = step * stepSize;
    } while (label <= this.maxValue);
  }

  /**
   * Draw x-axis lables
   * @param numColumLabels
   * @param lineChartPoints
   * @param ctx
   * @private
   */
  private drawColumnLabels(
    numColumLabels: number,
    lineChartPoints: LineChartPoint[],
    ctx: CanvasRenderingContext2D
  ) {
    for (let numerator = 0; numerator <= numColumLabels; numerator++) {
      // LHS date label
      const labelColumn = Math.floor((numerator * (lineChartPoints.length - 1)) / numColumLabels);
      const selectPoint = lineChartPoints[labelColumn];
      ctx.translate(
        this.graphOffset.x + (selectPoint.xIndex / 366) * this.graphWidth,
        this.graphOffset.y + this.graphHeight + 10
      );
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = this.textColor;
      ctx.fillText(selectPoint.date, 0, 0);
      ctx.setTransform(new DOMMatrix([1, 0, 0, 1, 0, 0]));
    }
  }

  protected plotPoints(
    ctx: CanvasRenderingContext2D,
    lineChartPoints: LineChartPoint[],
    lineColor: string,
    dash: number[] = []
  ): void {
    ctx.strokeStyle = lineColor;
    ctx.setLineDash(dash);
    const startDatum = lineChartPoints[0];
    if (startDatum && startDatum.count !== null) {
      const startPoint = this.graphPointToCanvasXY(startDatum.xIndex, startDatum.count);

      ctx.beginPath();
      ctx.moveTo(startPoint.x, startPoint.y);

      let lastDrawnXIndex = startDatum.xIndex;
      for (let i = 1; i < lineChartPoints.length; i++) {
        const datum = lineChartPoints[i];
        const count = datum.count;
        if (count !== null) {
          const drewLastPoint = lastDrawnXIndex == datum.xIndex - 1;
          const nextPoint = this.graphPointToCanvasXY(datum.xIndex, count);
          if (drewLastPoint) {
            ctx.lineTo(nextPoint.x, nextPoint.y);
          } else {
            ctx.moveTo(nextPoint.x, nextPoint.y);
          }
          lastDrawnXIndex = datum.xIndex;
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
    const maxXValue = 366;
    return this.graphOffset.x + ((x + 0.5) / maxXValue) * this.graphWidth;
  }

  private graphYtoCanvasY(y: number) {
    return this.graphOffset.y + this.graphHeight - (y / this.maxValue) * this.graphHeight;
  }

  private drawMonthLabels(ctx: CanvasRenderingContext2D) {
    // any year will do, we'll us the one at coding time. Slight hack to use month 0 for last day of year
    for (let month = 0; month <= 12; month++) {
      const firstOfMonth = DateTime.local(2024, month, 1);
      const dayOfYear = dateToLeapYearDayOfYear(firstOfMonth);
      const label = month ? `- ${month}/1` : "- 12/31";
      ctx.translate(
        this.graphXtoCanvasX(month ? dayOfYear : 366) - 4, // subtract half label font height, allowing for hyphen midpoint
        this.graphYtoCanvasY(0) + 2
      );
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = this.textColor;
      ctx.fillText(label, 0, 0);
      ctx.setTransform(new DOMMatrix([1, 0, 0, 1, 0, 0])); // counter rotate?
    }
  }
}

type MultiYearData = Record<string, LineChartPoint[]>;

function dateToLeapYearDayOfYear(date: DateTime) {
  // use 2024 as a standard leap year
  const leapYearDate = DateTime.local(2024, date.month, date.day);
  const startOfLeapYear = DateTime.local(2024, 1, 1);
  return Interval.fromDateTimes(startOfLeapYear, leapYearDate).count("days") + 1;
}

/**
 * Draw graph for a single species
 *
 * @param allData
 * @param targetSpecies
 * @param outFile
 */
function drawSpeciesGraph(allData: DayRecord[], targetSpecies: string | null, outFile: string) {
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

  const graph = new LineChart(800, 600, speciesDayCount, targetSpecies || "All species");
  graph.writeToPng(outFile);

  console.log(`Wrote ${speciesDayCount.length} points to ${outFile}`);
}

/**
 * Run script
 */
function main(): void {
  const target = process.argv[2];

  let minObservations = 10;
  let targetSpecies: string | null = null;
  if (target) {
    if (target.match(/^\d+$/)) {
      minObservations = parseInt(target, 10);
    } else {
      targetSpecies = target;
    }
  }

  const allData = loadCachedDailyData(rawDir);
  const aggregate = aggregateAllDays(allData, 1, minObservations);
  // const aggregate = aggregateAllDays(allData, 1, 1000);

  let drawSpecies: string[] = [];
  if (targetSpecies) {
    drawSpecies = [targetSpecies];
  } else {
    drawSpecies = aggregate.map((a) => a.bird);
  }

  function outPathForSpecies(species: string, speciesCount: number) {
    return `${__dirname}/tmp/${species} (${speciesCount}).png`;
  }

  // we want an ordered list of [ { bird: SPECIES, date: YYYY-MM-DD, count: number }]
  for (const species of drawSpecies) {
    const speciesCount = aggregate.find((a) => a.bird == species)?.count || 0;
    if (speciesCount >= 1) {
      const outFile = outPathForSpecies(species, speciesCount);
      drawSpeciesGraph(allData, species, outFile);
    }
  }
  let countAll = 0;
  aggregate.forEach((a) => (countAll += a.count));
  drawSpeciesGraph(allData, null, outPathForSpecies("All species", countAll));
}

main();
