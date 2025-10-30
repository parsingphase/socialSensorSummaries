#!/usr/bin/env npx tsx -r tsconfig-paths/register

import { DateTime, Duration } from "luxon";
import { config } from "./config/config";
import { fetchDailyCount } from "./lib/haiku";
import { seenBirds } from "./lib/sightings";
import { buildWeatherSummaryForDay } from "./lib/weather";
import { buildBirdPostForBluesky } from "./core/haiku2bluesky";
import { getAtprotoAgent, Link, postToAtproto, StrongPostRef } from "./lib/atproto";
import pino from "pino";

/**
 * CLI main loop
 */
async function main(): Promise<void> {
  const post = true;

  const whenLuxon = DateTime.now().minus(Duration.fromObject({ days: 1 }));
  const when = whenLuxon.toFormat("yyyy-MM-dd");
  const { serialNumber, apiBaseUrl: haikuBaseUrl } = config.haikubox;
  const birds = await fetchDailyCount(haikuBaseUrl, serialNumber, when);

  const listLength = 10;
  const postString = buildBirdPostForBluesky(birds || [], seenBirds, listLength);
  const logger = pino({});

  const client = await getAtprotoAgent(
    config.blueSky.serviceUrl,
    config.blueSky.username,
    config.blueSky.password,
    logger
  );

  let birdsStatus: StrongPostRef | null = null;
  if (post) {
    const links: Link[] = [
      { uri: "https://bsky.app/profile/parsingphase.dev/post/3ljfn54m4ls23", text: "caveat" },
    ];
    birdsStatus = await postToAtproto(client, postString, undefined, links, undefined, logger);

    console.log(`Posted bird list to ${birdsStatus.uri} / ${birdsStatus.cid}`);
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
    const weatherStatus = await postToAtproto(
      client,
      weatherSummary,
      birdsStatus || undefined,
      undefined,
      undefined,
      logger
    );
    console.log(`Posted weather status to ${weatherStatus.uri} / ${weatherStatus.cid}`);
  } else {
    console.log({ weatherSummary });
  }
}

main().finally(() => console.log("DONE"));
