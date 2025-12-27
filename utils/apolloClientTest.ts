#!/usr/bin/env npx tsx

import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";
import { dailyDetectionsQuery } from "../graphql/birdWeather/queries";
import { DailyDetectionsQuery, DailyDetectionsQueryVariables } from "../graphql/codegen/graphql";

/**
 * Tets script
 */
async function main(): Promise<void> {
  const client = new ApolloClient({
    link: new HttpLink({ uri: "https://app.birdweather.com/graphql" }),
    cache: new InMemoryCache(),
  });


  const res = await client.query<DailyDetectionsQuery, DailyDetectionsQueryVariables>({
    query: dailyDetectionsQuery,
    variables: { stationId: '20191', days: 3 },
  });
  console.log(JSON.stringify({ res }, undefined, 2));
}

main()
  .catch((e) => console.error(e))
  .finally(() => console.error("Done"));
