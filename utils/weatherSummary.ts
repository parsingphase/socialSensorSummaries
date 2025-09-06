#!/usr/bin/env npx tsx -r tsconfig-paths/register

import { DateTime } from "luxon";
import { config } from "../config/config";
import { buildWeatherSummaryForDay } from "../lib/weather";

/**
 * buildWeatherSummaryForDay from CLI
 */
async function main(): Promise<void> {
  const yesterday = DateTime.now().minus({ days: 1 }).toJSDate();
  const location = config.location;
  const ambientWeatherConfig = config.ambientWeather;
  const summary = await buildWeatherSummaryForDay(ambientWeatherConfig, location, yesterday);

  console.log(summary);
  console.log(summary.length);
}

main()
  .catch((e) => console.error(e))
  .finally(() => console.error("Done"));
