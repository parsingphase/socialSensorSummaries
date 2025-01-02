import { Context, ScheduledEvent } from "aws-lambda";
import { buildBirdPost, postToMastodon } from "./core/haiku2masto";

import { DateTime, Duration } from "luxon";
import { fetchDailyCount } from "./lib/haiku";
import { seenBirds } from "./lib/sightings";
import { AmbientWeatherApiConfig, buildWeatherSummaryForDay } from "./lib/weather";

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

export const handler = async (_event: ScheduledEvent, _context: Context): Promise<void> => {
  const mastoToken = assertedEnvVar("MASTO_CLIENT_TOKEN");
  const mastoBaseUrl = assertedEnvVar("MASTO_BASE_URL");

  const serialNumber = assertedEnvVar("HAIKU_SERIAL_NUMBER");
  const haikuBaseUrl = assertedEnvVar("HAIKU_BASE_URL");

  const AWNBaseUrl = assertedEnvVar("AWN_BASE_URL");
  const AWNApiKey = assertedEnvVar("AWN_API_KEY");
  const AWNApplicationKey = assertedEnvVar("AWN_APPLICATION_KEY");
  const AWNDeviceMac = assertedEnvVar("AWN_DEVICE_MAC");

  const latitude = Number(assertedEnvVar("SITE_LATITUDE"));
  const longitude = Number(assertedEnvVar("SITE_LONGITUDE"));

  const visibility = process.env.POST_VISIBILITY || "direct";

  const when = DateTime.now().minus(Duration.fromObject({ days: 1 }));
  const birds = await fetchDailyCount(haikuBaseUrl, serialNumber, when.toFormat("yyyy-MM-dd"));

  const postString = buildBirdPost(birds || [], 20, 500, 10, seenBirds);

  console.log({ birds, postString, length: postString.length });

  const birdsStatus = await postToMastodon(mastoBaseUrl, mastoToken, postString, visibility);

  console.log(`Posted bird list to ${birdsStatus.url} / ${birdsStatus.id}`);

  const ambientWeatherConfig: AmbientWeatherApiConfig = {
    apiBaseUrl: AWNBaseUrl,
    apiKey: AWNApiKey,
    applicationKey: AWNApplicationKey,
    deviceMac: AWNDeviceMac,
  };

  const weatherSummary = await buildWeatherSummaryForDay(
    ambientWeatherConfig,
    { latitude, longitude },
    when.toJSDate()
  );

  const weatherStatus = await postToMastodon(
    mastoBaseUrl,
    mastoToken,
    weatherSummary,
    visibility,
    birdsStatus.id
  );
  console.log(`Posted weather status to ${weatherStatus.url} / ${weatherStatus.id}`);
};
