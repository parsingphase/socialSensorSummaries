#!/usr/bin/env npx tsx

import { dailyDetectionsQuery } from "../lib/birdWeather/queries";
import { DailyDetectionsQuery, DailyDetectionsQueryVariables } from "../lib/birdWeather/codegen/graphql";
import { initBirdWeatherClient } from "../lib/birdWeather/client";

/**
 * Tets script
 */
async function main(): Promise<void> {
  const client = initBirdWeatherClient();

  const res = await client.query<DailyDetectionsQuery, DailyDetectionsQueryVariables>({
    query: dailyDetectionsQuery,
    variables: { stationId: "20191", days: 3 },
  });

  const speciesObservations = res.data?.dailyDetectionCounts;

  if (speciesObservations) {
    let i = 0;
    for (const day of speciesObservations) {
      const date = day.date; // NOTE: Date remains off-by-one at time of writing
      console.log(date);
      const counts = day.counts;

      const sortedCounts = counts.sort((a, b) => a.count - b.count).reverse();

      for (const species of sortedCounts) {
        console.log(`${i++}: ${species.species.commonName} : ${species.count}`);
      }
    }
  }
}

main()
  .catch((e) => console.error(e))
  .finally(() => console.error("Done"));
