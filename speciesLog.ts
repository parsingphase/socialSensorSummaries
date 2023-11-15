#!/usr/bin/env npx ts-node --esm -r tsconfig-paths/register

import { loadCachedDailyData } from "./haiku";
import { createCanvas, DOMMatrix } from "canvas";
import fs from "fs";

const rawDir = `${__dirname}/rawHaikuData`;

type DatedCount = { bird: string; date: string; count: number };

type LineChartPoint = { columnLabel: string; count: number };

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
      x: 100,
      y: 100,
    };

    this.graphWidth = Math.floor(canvasWidth - 150);
    this.graphHeight = Math.floor(canvasHeight - 200);

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
    const ctx = canvas.getContext("2d");

    const bgColor = "rgb(200,200,200)";
    const fgColor = "rgb(230,230,230)";
    const lineColor = "rgb(63,63,127)";
    const textColor = "rgb(0,0,0)";

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    ctx.fillStyle = textColor;
    ctx.font = "20px Impact";
    const textMeasure = ctx.measureText(this.title);
    ctx.fillText(this.title, (this.canvasWidth - textMeasure.width) / 2, 50);

    ctx.font = "12px Impact";
    ctx.fillText(
      "0",
      this.graphOffset.x - 20,
      this.graphOffset.y + this.graphHeight + 6
    );
    ctx.fillText(
      this.maxValue.toString(),
      this.graphOffset.x - 30,
      this.graphOffset.y + 6
    );

    ctx.fillStyle = fgColor;
    ctx.fillRect(
      this.graphOffset.x,
      this.graphOffset.y,
      this.graphWidth,
      this.graphHeight
    );

    const lineChartPoints = [...this.data];
    ctx.strokeStyle = lineColor;

    const startDatum = lineChartPoints[0];
    if (startDatum) {
      const startPoint = this.graphPointToCanvasXY(0, startDatum.count);

      console.log({ startPoint });
      ctx.beginPath();
      ctx.moveTo(startPoint.x, startPoint.y);
      for (let i = 1; i < lineChartPoints.length; i++) {
        const count = lineChartPoints[i].count;
        const nextPoint = this.graphPointToCanvasXY(i, count);
        console.log({ nextPoint });
        ctx.lineTo(nextPoint.x, nextPoint.y);
      }
      ctx.stroke();

      // LHS date label
      ctx.translate(this.graphOffset.x, this.graphOffset.y + this.graphHeight + 10);
      ctx.rotate(Math.PI/2);
      ctx.fillStyle = textColor;
      ctx.fillText(
        startDatum.columnLabel,
        0,
        0
      );
      ctx.setTransform(new DOMMatrix([1, 0, 0, 1, 0, 0]));

      // RHS date label
      ctx.translate(this.graphOffset.x + this.graphWidth - 6, this.graphOffset.y + this.graphHeight + 10);
      ctx.rotate(Math.PI/2);
      ctx.fillStyle = textColor;
      ctx.fillText(
        this.data[this.data.length-1].columnLabel,
        0,
        0
      );
      ctx.setTransform(new DOMMatrix([1, 0, 0, 1, 0, 0]));

    }
    return canvas;
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

function main() {
  const targetSpecies = process.argv[2];

  if (!targetSpecies) {
    console.log("Must specify species");
    process.exit(1);
  }

  const allData = loadCachedDailyData(rawDir);
  // we want an ordered list of [ { bird: SPECIES, date: YYYY-MM-DD, count: number }]

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
  const outFile = `${__dirname}/tmp/${targetSpecies}.png`;
  graph.writeToPng(outFile);

  // console.log(JSON.stringify(speciesDayCount));
  console.log(`Wrote to ${data.length} points to ${outFile}`);
}

main();
