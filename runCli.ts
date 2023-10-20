#!/usr/bin/env npx ts-node --esm -r tsconfig-paths/register

import { DateTime, Duration } from "luxon";
import { config } from "./config/config";
import {
  buildBirdPost,
  fetchDailyCount,
  postToMastodon,
} from "./core/haiku2masto";

/**
 * CLI main loop
 */
async function main(): Promise<void> {
  const when = DateTime.now()
    .minus(Duration.fromObject({ days: 1 }))
    .toFormat("yyyy-MM-dd");
  const { serialNumber, apiBaseUrl: haikuBaseUrl } = config.haikubox;
  const birds = await fetchDailyCount(haikuBaseUrl, serialNumber, when);

  const listLength = 10;
  const postString = buildBirdPost(birds, listLength);

  console.log({ birds, postString, length: postString.length });

  const { apiClientToken, apiBaseUrl: mastoBaseUrl } = config.mastodon;
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
