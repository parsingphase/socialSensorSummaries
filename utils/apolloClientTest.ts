#!/usr/bin/env npx tsx

import { ApolloClient, HttpLink, InMemoryCache, gql } from "@apollo/client";
import { DailyDetectionsQuery, DailyDetectionsQueryVariables } from "../codegen/gql/graphql";

/**
 * Tets script
 */
async function main(): Promise<void> {
  const client = new ApolloClient({
    link: new HttpLink({ uri: "https://app.birdweather.com/graphql" }),
    cache: new InMemoryCache(),
  });
  const dailyDetectionsQuery = gql`
    query DailyDetections($stationId: ID!, $days: Int!) {
      dailyDetectionCounts(stationIds: [$stationId], period: { count: $days, unit: "day" }) {
        date
        dayOfYear
        counts {
          count
          species {
            alpha
            commonName
          }
        }
      }
    }
  `;

  const res = await client.query<DailyDetectionsQuery, DailyDetectionsQueryVariables>({
    query: dailyDetectionsQuery,
    variables: { stationId: '20191', days: 3 },
  });
  console.log(JSON.stringify({ res }, undefined, 2));
}

main()
  .catch((e) => console.error(e))
  .finally(() => console.error("Done"));
