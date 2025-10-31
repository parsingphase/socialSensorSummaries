#!/usr/bin/env -S npx tsx

import fs from "fs";
import { drawChartFromDailySongData } from "./lib/charts/barChart";
import * as PImage from "pureimage";

/**
 * CLI payload - draw chart for one day's topX birds
 */
async function main(): Promise<void> {
  const dateString = "2025-10-28";
  const dayData: { count: number; bird: string }[] = JSON.parse(
    fs.readFileSync(`rawHaikuData/${dateString}.json`).toString()
  );
  const fileData = drawChartFromDailySongData(dayData, dateString);
  const outPath = __dirname + "/tmp/bar-pimage.png";
  // fs.writeFileSync(outPath, fileData);
  await PImage.encodePNGToStream(fileData, fs.createWriteStream(outPath))
  console.log(`Wrote PNG to ${outPath}`);
}

main().finally(() => console.log("DONE"));
