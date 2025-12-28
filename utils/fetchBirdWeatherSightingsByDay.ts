#!/usr/bin/env npx tsx

import { DateTime, Duration } from "luxon";
import { fetchDailyCount } from "../lib/birdWeather/fetch";

/**
 * Test script
 */
async function main(): Promise<void> {
  const yesterday = DateTime.now().minus(Duration.fromObject({ days: 1 }));

  // const dateOfInterest = '2025-12-27';
  const dateOfInterest = yesterday.toISODate();
  const stationId = "20191";

  const sortedRecords = await fetchDailyCount(
    "https://app.birdweather.com/graphql",
    stationId,
    dateOfInterest
  );

  console.log({ date: dateOfInterest, sortedRecords });
}

main()
  .catch((e) => console.error(e))
  .finally(() => console.error("Done"));
