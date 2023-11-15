#!/usr/bin/env npx ts-node --esm -r tsconfig-paths/register

import { DateTime, Duration } from "luxon";
import { config } from "./config/config";
import { buildBirdPost, postToMastodon } from "./core/haiku2masto";
import { fetchDailyCount } from "./haiku";

/**
 * CLI main loop
 */
async function main(): Promise<void> {
  const when = DateTime.now()
    .minus(Duration.fromObject({ days: 1 }))
    .toFormat("yyyy-MM-dd");
  const { serialNumber, apiBaseUrl: haikuBaseUrl } = config.haikubox;
  const birds = await fetchDailyCount(haikuBaseUrl, serialNumber, when);

  const listLength = 20;
  const {
    apiClientToken,
    apiBaseUrl: mastoBaseUrl,
    maxPostLength,
  } = config.mastodon;
  const postString = buildBirdPost(birds, listLength, maxPostLength, 3);

  console.log({ birds, postString, length: postString.length });

  const { postVisibility } = config.lambda.dev;
  const status = await postToMastodon(
    mastoBaseUrl,
    apiClientToken,
    postString,
    postVisibility
  );

  console.log(`Posted to ${status.url}`);
}

main().finally(() => console.log("DONE"));
