#!/usr/bin/env npx ts-node --esm -r tsconfig-paths/register

import { aggregateAllDays, DayRecord, loadCachedDailyData } from "./haiku";
import { CanvasRenderingContext2D, createCanvas, DOMMatrix } from "canvas";
import fs from "fs";

const rawDir = `${__dirname}/rawHaikuData`;

type DatedCount = { bird: string; date: string; count: number };

type LineChartPoint = { columnLabel: string; count: number };

function smooth(data: LineChartPoint[], number: number) {
  const reach = Math.floor(number / 2);
  const outData: LineChartPoint[] = [];
  for (let i = 0; i < data.length; i++) {
    const segment = data.slice(
      Math.max(i - reach, 0),
      Math.min(i + reach, data.length - 1)
    );

    let total = 0;
    segment.forEach((s) => (total += s.count));
    outData.push({
      columnLabel: data[i].columnLabel,
      count: total / segment.length,
    });
  }
  return outData;
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
    title: string
  ) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.title = title;

    this.graphOffset = {
      x: 60,
      y: 60,
    };

    this.graphWidth = Math.floor(canvasWidth - 100);
    this.graphHeight = Math.floor(canvasHeight - 150);

    this.data = data;

    this.maxValue = Math.max(...data.map((d) => d.count));
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
    ctx.fillRect(
      this.graphOffset.x,
      this.graphOffset.y,
      this.graphWidth,
      this.graphHeight
    );

    const lineChartPoints = [...this.data];
    this.plotPoints(ctx, lineChartPoints, this.dataColor);
    this.plotPoints(
      ctx,
      smooth(lineChartPoints, 7),
      this.avgColor,
      this.avgDash
    );

    this.drawColumnLabels(10, lineChartPoints, ctx);

    return canvas;
  }

  private drawValueLabels(ctx: CanvasRenderingContext2D) {
    const numSteps = 10;
    let stepSize = 1;
    let exponent = 0;

    // console.log({ maxValue: this.maxValue });

    stepGen: while (true) {
      let nextStep;
      for (const multiple of [1, 2, 5]) {
        nextStep = multiple * Math.pow(10, exponent);
        // console.log({ stepSize });
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
      // console.log({ label, labelYPos, maxValue: this.maxValue });
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
      const labelColumn = Math.floor(
        (numerator * (lineChartPoints.length - 1)) / numColumLabels
      );
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
    const startDatum = lineChartPoints[0];
    if (startDatum) {
      const startPoint = this.graphPointToCanvasXY(0, startDatum.count);

      // console.log({ startPoint });
      ctx.beginPath();
      ctx.moveTo(startPoint.x, startPoint.y);
      for (let i = 1; i < lineChartPoints.length; i++) {
        const count = lineChartPoints[i].count;
        const nextPoint = this.graphPointToCanvasXY(i, count);
        // console.log({ nextPoint });
        ctx.lineTo(nextPoint.x, nextPoint.y);
      }
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  private graphPointToCanvasXY(i: number, count: number) {
    return {
      x: this.graphOffset.x + ((i + 0.5) / this.numValues) * this.graphWidth,
      y:
        this.graphOffset.y +
        this.graphHeight -
        (count / this.maxValue) * this.graphHeight,
    };
  }
}

function drawSpeciesGraph(
  allData: DayRecord[],
  targetSpecies: string,
  outFile: string
) {
  const speciesDayCount: DatedCount[] = [];

  for (const dailyTotals of allData) {
    const { date, dayData } = dailyTotals;
    const speciesCount = dayData.filter((d) => d.bird === targetSpecies);
    const count = speciesCount.length > 0 ? speciesCount[0].count : 0;
    const dateRecord: DatedCount = {
      bird: targetSpecies,
      date,
      count,
    };
    speciesDayCount.push(dateRecord);
  }

  const data = speciesDayCount.map((d) => {
    const datum: LineChartPoint = { columnLabel: d.date, count: d.count };
    return datum;
  });

  const graph = new LineChart(800, 600, data, targetSpecies);
  graph.writeToPng(outFile);

  // console.log(JSON.stringify(speciesDayCount));
  console.log(`Wrote ${data.length} points to ${outFile}`);
}

function main() {
  const targetSpecies = process.argv[2];
  const allData = loadCachedDailyData(rawDir);
  const aggregate = aggregateAllDays(allData, 1, 10);

  let drawSpecies: string[] = [];
  if (targetSpecies) {
    drawSpecies = [targetSpecies];
  } else {
    drawSpecies = aggregate.map((a) => a.bird);
  }

  // we want an ordered list of [ { bird: SPECIES, date: YYYY-MM-DD, count: number }]
  for (const species of drawSpecies) {
    const speciesCount = aggregate.filter((a) => a.bird == species)[0].count;
    const outFile = `${__dirname}/tmp/${species} (${speciesCount}).png`;
    drawSpeciesGraph(allData, species, outFile);
  }
}

main();
