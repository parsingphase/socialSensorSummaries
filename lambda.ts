import { Context, ScheduledEvent } from "aws-lambda";
import {
  buildBirdPost,
  postToMastodon,
} from "./core/haiku2masto";

import { DateTime, Duration } from "luxon";
import { fetchDailyCount } from "./haiku";

/**
 * Return an ENV value, object if it's missing
 *
 * @param key
 */
function assertedEnvVar(key: string): string {
  const token = process.env[key];
  if (!token) {
    throw new Error("Must set " + key);
  }
  return token;
}

export const handler = async (
  event: ScheduledEvent,
  context: Context
): Promise<void> => {
  void event;
  void context;

  const mastoToken = assertedEnvVar("MASTO_CLIENT_TOKEN");
  const mastoBaseUrl = assertedEnvVar("MASTO_BASE_URL");

  const serialNumber = assertedEnvVar("HAIKU_SERIAL_NUMBER");
  const haikuBaseUrl = assertedEnvVar("HAIKU_BASE_URL");

  const visibility = process.env.POST_VISIBILITY || "direct";

  const when = DateTime.now()
    .minus(Duration.fromObject({ days: 1 }))
    .toFormat("yyyy-MM-dd");
  const birds = await fetchDailyCount(haikuBaseUrl, serialNumber, when);

  const postString = buildBirdPost(birds, 20, 500, 3);

  console.log({ birds, postString, length: postString.length });

  const status = await postToMastodon(
    mastoBaseUrl,
    mastoToken,
    postString,
    visibility
  );

  console.log(`Posted to ${status.url}`);
};
