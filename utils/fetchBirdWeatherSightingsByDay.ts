#!/usr/bin/env npx tsx

import { allDetectionsInPeriodQuery } from "../graphql/birdWeather/queries";
import {
  AllDetectionsInPeriodQuery,
  AllDetectionsInPeriodQueryVariables,
} from "../graphql/codegen/graphql";
import { initBirdWeatherClient } from "../graphql/birdWeather/client";
import { DateTime, Duration, Interval } from "luxon";
import { ApolloClient, MaybeMasked } from "@apollo/client";
import QueryResult = ApolloClient.QueryResult;
import { BirdRecord } from "../lib/haiku";

/**
 * Tets script
 */
async function main(): Promise<void> {
  const client = initBirdWeatherClient();

  const start = DateTime.now()
    .minus(Duration.fromObject({ days: 1 }))
    .startOf("day");
  const end = DateTime.now().startOf("day");

  const startString = start.toISO();
  const endString = end.toISO();
  const validPeriod = Interval.fromDateTimes(start,end);

  console.log({ startString, endString });

  const countBySpecies: Record<string, number> = {};

  let hasNextPage: boolean = true;
  let previousEndCursor: string | null | undefined = undefined;

  let res: QueryResult<MaybeMasked<AllDetectionsInPeriodQuery>>;
  do {
    res = await client.query<AllDetectionsInPeriodQuery, AllDetectionsInPeriodQueryVariables>({
      query: allDetectionsInPeriodQuery,
      variables: { stationId: "20191", from: startString, to: endString, after: previousEndCursor },
      // FIXME not applying from/to params?
    });
    const detectionResult = res.data?.detections;

    if (detectionResult) {
      const { pageInfo, edges } = detectionResult;
      const observationEdges = edges ?? [];
      // const numObs = observationEdges.length;
      observationEdges.forEach((e) => {
        if (e?.node) {

          const observationTime = DateTime.fromISO(e.node.timestamp);
          const withinPeriod = validPeriod.contains(observationTime);

          console.log(
            `${e.node.timestamp}: ${e.node.species.commonName}: ${e.node.confidence}: ${withinPeriod}`
          );
          if(withinPeriod) {
            countBySpecies[e.node.species.commonName] =
              (countBySpecies[e.node.species.commonName] ?? 0) + 1;
          }
        }
      });

      ({ hasNextPage, endCursor: previousEndCursor } = pageInfo);

      // console.log({ hasNextPage, endCursor: previousEndCursor, numObs });
    } else {
      break;
    }
  } while (hasNextPage);

  console.log({ countBySpecies });
  const birdRecords: BirdRecord[] = [];
  for (const key in countBySpecies) {
    birdRecords.push({ bird: key, count: countBySpecies[key] });
  }

  // console.log({ birdRecords });

  const sortedRecords = birdRecords.sort((a, b) => b.count - a.count);

  console.log({ date: start.toFormat("yyyy-MM-dd"), sortedRecords });
}

main()
  .catch((e) => console.error(e))
  .finally(() => console.error("Done"));
