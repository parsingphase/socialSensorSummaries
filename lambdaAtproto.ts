import { Context, ScheduledEvent } from "aws-lambda";

import { DateTime, Duration } from "luxon";
import { fetchDailyCount } from "./lib/haiku";
import { seenBirds } from "./lib/sightings";
import { AmbientWeatherApiConfig, buildWeatherSummaryForDay } from "./lib/weather";
import { buildBirdPostForBluesky } from "./core/haiku2bluesky";
import { getAtprotoAgent, ImageSpecFromBuffer, Link, postToAtproto } from "./lib/atproto";
import pino from "pino";
import { drawChartFromDailySongData, Offsets } from "./lib/charts/barChart";

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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const handler = async (_event: ScheduledEvent, _context: Context): Promise<void> => {
  void _event;
  void _context;

  const username = assertedEnvVar("BLUESKY_USERNAME");
  const password = assertedEnvVar("BLUESKY_PASSWORD");
  const serverBaseUrl = assertedEnvVar("BLUESKY_BASE_URL");

  const serialNumber = assertedEnvVar("HAIKU_SERIAL_NUMBER");
  const haikuBaseUrl = assertedEnvVar("HAIKU_BASE_URL");

  const AWNBaseUrl = assertedEnvVar("AWN_BASE_URL");
  const AWNApiKey = assertedEnvVar("AWN_API_KEY");
  const AWNApplicationKey = assertedEnvVar("AWN_APPLICATION_KEY");
  const AWNDeviceMac = assertedEnvVar("AWN_DEVICE_MAC");

  const latitude = Number(assertedEnvVar("SITE_LATITUDE"));
  const longitude = Number(assertedEnvVar("SITE_LONGITUDE"));

  const when = DateTime.now().minus(Duration.fromObject({ days: 1 }));
  const whenString = when.toFormat("yyyy-MM-dd");
  const birds = await fetchDailyCount(haikuBaseUrl, serialNumber, whenString);

  const maxBirds = 10;
  const minObservationCount = 10;
  const postString = buildBirdPostForBluesky(birds || [], seenBirds, maxBirds, minObservationCount);

  const logger = pino({});

  logger.info({ birds, postString, length: postString.length });

  let images: ImageSpecFromBuffer[] = [];
  if (birds && birds.length > 0) {
    const dayData = birds.slice(0, maxBirds).filter((b) => b.count >= minObservationCount);

    const width = 1200;
    const height = 800;

    const offsets: Offsets = {
      top: Math.round(height / 10),
      left: Math.round(width / 4),
      bottom: Math.round(height / 12.5),
      right: Math.round(width / 25),
    };

    const imageBuffer = drawChartFromDailySongData(dayData, whenString, width, height, offsets);
    const alt = ["Bar chart of the above data:", ""];

    for (const bird of dayData) {
      alt.push(`${bird.bird}: ${bird.count} call${bird.count == 1 ? "" : "s"}`);
    }
    images = [{ data: imageBuffer, alt: alt.join("\n"), width, height, mimetype: "image/png" }];
    logger.info("Image created");
  }

  const client = await getAtprotoAgent(serverBaseUrl, username, password, logger);

  const links: Link[] = [
    { uri: "https://bsky.app/profile/parsingphase.dev/post/3ljfn54m4ls23", text: "caveat" },
  ];

  const birdsStatus = await postToAtproto(client, postString, undefined, links, images, logger);

  logger.info(`Posted bird list to ${birdsStatus.uri} / ${birdsStatus.cid}`);

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

  const weatherStatus = await postToAtproto(
    client,
    weatherSummary,
    birdsStatus,
    undefined,
    undefined,
    logger
  );
  logger.info(`Posted weather status to ${weatherStatus.uri} / ${weatherStatus.cid}`);
};
