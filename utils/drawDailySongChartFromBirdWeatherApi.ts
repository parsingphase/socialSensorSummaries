#!/usr/bin/env npx tsx

import fs from "fs";
import { drawChartFromDailySongData, Offsets } from "../lib/charts/barChart";
import { fetchDailyCount } from "../lib/birdWeather";
import { config } from "../config/config";

/**
 * CLI payload - draw chart for one day's topX birds
 */
async function main(): Promise<void> {
  const startEpoch = Date.now();

  const dateString = "2025-12-27";
  const minConfidence = 0; // Only confidence > 0.5 (configurable?) seems to appear in source data

  const width = 1200;
  const height = 800;
  // { top: 50, left: 170, bottom: 40, right: 20 }
  const offsets: Offsets = {
    top: Math.round(height / 10),
    left: Math.round(width / 4),
    bottom: Math.round(height / 8),
    right: Math.round(width / 25),
  };

  const dayData = await fetchDailyCount(
    config.birdWeather.apiBaseUrl,
    config.birdWeather.stationId,
    dateString,
    minConfidence
  );

  const fileData = drawChartFromDailySongData(
    dayData?.slice(0, 20) || [],
    dateString,
    width,
    height,
    offsets,
    "from BirdWeather PUC"
  );
  const outPath = __dirname + `/../tmp/${dateString}-birdweather-${minConfidence}.png`;
  fs.writeFileSync(outPath, fileData);

  const timeTakenMs = Date.now() - startEpoch;

  console.log(`Wrote PNG to ${outPath} in ${timeTakenMs} ms`);
}

main().finally(() => console.log("DONE"));
