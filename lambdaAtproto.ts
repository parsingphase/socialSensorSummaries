import { Context, ScheduledEvent } from "aws-lambda";

import { DateTime, Duration } from "luxon";
import { BirdRecord, fetchDailyCount as fetchDailyCountFromHaikuboxApi } from "./lib/haiku";
import { fetchDailyCount as fetchDailyCountFromBirdWeatherApi } from "./lib/birdWeather";
import { seenBirds } from "./lib/sightings";
import { AmbientWeatherApiConfig, buildWeatherSummaryForDay } from "./lib/weather";
import { buildBirdPostForBluesky } from "./core/haiku2bluesky";
import {
  getAtprotoAgent,
  ImageSpecFromBuffer,
  Link,
  postToAtproto,
  StrongPostRef,
} from "./lib/atproto";
import pino from "pino";
import { drawChartFromDailySongData, Offsets } from "./lib/charts/barChart";
import { AtpAgent } from "@atproto/api";

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

/**
 * Build bar chart to attach to post (if data available)
 *
 * @param birds
 * @param maxBirds
 * @param minObservationCount
 * @param whenString
 * @param source
 * @param logger
 */
function buildBarChartForPost(
  birds: BirdRecord[] | null,
  maxBirds: number,
  minObservationCount: number,
  whenString: string,
  source: string,
  logger: pino.Logger
): ImageSpecFromBuffer[] {
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

    const imageBuffer = drawChartFromDailySongData(
      dayData,
      whenString,
      width,
      height,
      offsets,
      source
    );
    const alt = ["Bar chart of the above data:", ""];

    for (const bird of dayData) {
      alt.push(`${bird.bird}: ${bird.count} call${bird.count == 1 ? "" : "s"}`);
    }
    images = [{ data: imageBuffer, alt: alt.join("\n"), width, height, mimetype: "image/png" }];
    logger.info("Image created");
  }
  return images;
}

/**
 * Build & post text & image from provided data
 * @param birds
 * @param logger
 * @param source
 * @param whenString
 * @param client
 * @param replyRef
 */
async function postStatusFromBirdList(
  birds: BirdRecord[],
  logger: pino.Logger,
  source: string,
  whenString: string,
  client: AtpAgent,
  replyRef?: StrongPostRef
): Promise<StrongPostRef> {
  const maxBirds = 10;
  const minObservationCount = 10;
  const links: Link[] = [
    { uri: "https://bsky.app/profile/parsingphase.dev/post/3ljfn54m4ls23", text: "caveat" },
  ];

  const postString = buildBirdPostForBluesky(birds || [], seenBirds, maxBirds, minObservationCount);
  logger.info({ birds, postString, length: postString.length, source }, source + " Chart");
  const images = buildBarChartForPost(
    birds,
    maxBirds,
    minObservationCount,
    whenString,
    `from ${source}`,
    logger
  );
  const birdsStatus = await postToAtproto(client, postString, replyRef, links, images, logger);
  logger.info(`Posted ${source} bird list to ${birdsStatus.uri} / ${birdsStatus.cid}`);
  return birdsStatus;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const handler = async (_event: ScheduledEvent, _context: Context): Promise<void> => {
  void _event;
  void _context;

  // Environmental setup
  const blueskyUsername = assertedEnvVar("BLUESKY_USERNAME");
  const blueskyPassword = assertedEnvVar("BLUESKY_PASSWORD");
  const blueskyServerBaseUrl = assertedEnvVar("BLUESKY_BASE_URL");

  const haikuSerialNumber = assertedEnvVar("HAIKU_SERIAL_NUMBER");
  const haikuBaseUrl = assertedEnvVar("HAIKU_BASE_URL");

  const birdWeatherStationId = assertedEnvVar("BIRDWEATHER_STATION_ID");
  const birdweatherBaseUrl = assertedEnvVar("BIRDWEATHER_BASE_URL");

  const AWNBaseUrl = assertedEnvVar("AWN_BASE_URL");
  const AWNApiKey = assertedEnvVar("AWN_API_KEY");
  const AWNApplicationKey = assertedEnvVar("AWN_APPLICATION_KEY");
  const AWNDeviceMac = assertedEnvVar("AWN_DEVICE_MAC");

  const latitude = Number(assertedEnvVar("SITE_LATITUDE"));
  const longitude = Number(assertedEnvVar("SITE_LONGITUDE"));

  // Post setup
  const when = DateTime.now().minus(Duration.fromObject({ days: 1 }));
  const whenString = when.toFormat("yyyy-MM-dd");

  const logger = pino({});

  const client = await getAtprotoAgent(
    blueskyServerBaseUrl,
    blueskyUsername,
    blueskyPassword,
    logger
  );

  // Birdweather Post Generation
  const bwBirds = await fetchDailyCountFromBirdWeatherApi(
    birdweatherBaseUrl,
    birdWeatherStationId,
    whenString
  );
  const bwStatus = await postStatusFromBirdList(
    bwBirds ?? [],
    logger,
    "Birdweather PUC",
    whenString,
    client
  );

  // Haikubox Post Generation
  const birds = await fetchDailyCountFromHaikuboxApi(haikuBaseUrl, haikuSerialNumber, whenString);
  const source = "Haikubox";
  const haikuboxStatus = await postStatusFromBirdList(
    birds ?? [],
    logger,
    source,
    whenString,
    client,
    bwStatus
  );
  void haikuboxStatus;

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
    bwStatus,
    undefined,
    undefined,
    logger
  );
  logger.info(`Posted weather status to ${weatherStatus.uri} / ${weatherStatus.cid}`);
};
