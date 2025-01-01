#!/usr/bin/env npx tsx -r tsconfig-paths/register

import { DateTime, Duration } from "luxon";
import { config } from "./config/config";
import { buildBirdPost, postToMastodon } from "./core/haiku2masto";
import { fetchDailyCount } from "./lib/haiku";
import { seenBirds } from "./lib/sightings";
import { buildDaylightWeatherSummaryForDay } from "./lib/weather";

/**
 * CLI main loop
 */
async function main(): Promise<void> {
  const whenLuxon = DateTime.now().minus(Duration.fromObject({ days: 1 }));
  const when = whenLuxon.toFormat("yyyy-MM-dd");
  const { serialNumber, apiBaseUrl: haikuBaseUrl } = config.haikubox;
  const birds = await fetchDailyCount(haikuBaseUrl, serialNumber, when);

  const listLength = 20;
  const { apiClientToken, apiBaseUrl: mastoBaseUrl, maxPostLength } = config.mastodon;
  const postString = buildBirdPost(birds || [], listLength, maxPostLength, 3, seenBirds);

  console.log({ birds, postString, length: postString.length });

  const { postVisibility } = config.lambda.dev;
  const birdsStatus = await postToMastodon(
    mastoBaseUrl,
    apiClientToken,
    postString,
    postVisibility
  );

  console.log(`Posted bird list to ${birdsStatus.url} / ${birdsStatus.id}`);

  const location = config.location;
  const ambientWeatherConfig = config.ambientWeather;
  const weatherSummary = await buildDaylightWeatherSummaryForDay(
    ambientWeatherConfig,
    location,
    whenLuxon.toJSDate()
  );

  const weatherStatus = await postToMastodon(
    mastoBaseUrl,
    apiClientToken,
    weatherSummary,
    postVisibility,
    birdsStatus.id
  );
  console.log(`Posted weather status to ${weatherStatus.url} / ${weatherStatus.id}`);
}

main().finally(() => console.log("DONE"));
