#!/usr/bin/env npx tsx -r tsconfig-paths/register

import { DateTime, Duration } from "luxon";
import { config } from "./config/config";
import { buildBirdPostForMastodon, postToMastodon } from "./core/haiku2masto";
import { fetchDailyCount } from "./lib/haiku";
import { seenBirds } from "./lib/sightings";
import { buildWeatherSummaryForDay } from "./lib/weather";
import { Status } from "masto";

/**
 * CLI main loop
 */
async function main(): Promise<void> {
  const post = false;

  const whenLuxon = DateTime.now().minus(Duration.fromObject({ days: 1 }));
  const when = whenLuxon.toFormat("yyyy-MM-dd");
  const { serialNumber, apiBaseUrl: haikuBaseUrl } = config.haikubox;
  const birds = await fetchDailyCount(haikuBaseUrl, serialNumber, when);

  const listLength = 10;
  const { apiClientToken, apiBaseUrl: mastoBaseUrl, maxPostLength } = config.mastodon;
  const postString = buildBirdPostForMastodon(birds || [], seenBirds, listLength, 10, maxPostLength);

  const { postVisibility } = config.lambda.dev;

  let birdsStatus: Status | null = null;
  if (post) {
    birdsStatus = await postToMastodon(mastoBaseUrl, apiClientToken, postString, postVisibility);

    console.log(`Posted bird list to ${birdsStatus.url} / ${birdsStatus.id}`);
  } else {
    console.log({ postString });
  }

  const location = config.location;
  const ambientWeatherConfig = config.ambientWeather;
  const weatherSummary = await buildWeatherSummaryForDay(
    ambientWeatherConfig,
    location,
    whenLuxon.toJSDate()
  );

  if (post) {
    const weatherStatus = await postToMastodon(
      mastoBaseUrl,
      apiClientToken,
      weatherSummary,
      postVisibility,
      birdsStatus?.id || "unused"
    );
    console.log(`Posted weather status to ${weatherStatus.url} / ${weatherStatus.id}`);
  } else {
    console.log({ weatherSummary });
  }
}

main().finally(() => console.log("DONE"));
