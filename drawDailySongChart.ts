#!/usr/bin/env npx tsx

import fs from "fs";
import { drawChartFromDailySongData, Offsets } from "./lib/charts/barChart";

/**
 * CLI payload - draw chart for one day's topX birds
 */
async function main(): Promise<void> {
  const dateString = "2025-10-30";

  const width = 1200;
  const height = 800;
  // { top: 50, left: 170, bottom: 40, right: 20 }
  const offsets: Offsets = {
    top: Math.round(height / 10),
    left: Math.round(width / 4),
    bottom: Math.round(height / 12.5),
    right: Math.round(width / 25),
  };

  const dayData: { count: number; bird: string }[] = JSON.parse(
    fs.readFileSync(`rawHaikuData/${dateString}.json`).toString()
  );

  const fileData = drawChartFromDailySongData(dayData, dateString, width, height, offsets);
  const outPath = __dirname + "/tmp/bar.png";
  fs.writeFileSync(outPath, fileData);
  console.log(`Wrote PNG to ${outPath}`);
}

main().finally(() => console.log("DONE"));
