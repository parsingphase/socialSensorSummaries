import type { Context, ScheduledEvent } from "aws-lambda";
import { DateTime, Duration } from "luxon";
import { createRestAPIClient } from "masto";
import pino from "pino";
import {
	buildAndUploadDailySongChart,
	buildBirdPostForMastodon,
	postToMastodon,
} from "./core/haiku2masto";
import { drawChartFromDailySongData, Offsets } from "./lib/charts/barChart";
import { BirdRecord, fetchDailyCount } from "./lib/haiku";
import type { MastoClient } from "./lib/masto/types";
import { seenBirds } from "./lib/sightings";
import {
	type AmbientWeatherApiConfig,
	buildWeatherSummaryForDay,
} from "./lib/weather";

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
	_event: ScheduledEvent,
	_context: Context,
): Promise<void> => {
	void _event;
	void _context;

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
	const whenString = when.toFormat("yyyy-MM-dd");
	const birds = await fetchDailyCount(haikuBaseUrl, serialNumber, whenString);

	const maxBirds = 20;
	const minObservationCount = 10;
	const postString = buildBirdPostForMastodon(
		birds || [],
		seenBirds,
		maxBirds,
		minObservationCount,
		500,
	);

	const logger = pino({});

	logger.info({ birds, postString, length: postString.length });

	const mastoClient: MastoClient = createRestAPIClient({
		url: mastoBaseUrl,
		accessToken: mastoToken,
	});

	let attachmentIds: string[] = [];

	if (birds && birds.length > 0) {
		const dayData = birds
			.slice(0, maxBirds)
			.filter((b) => b.count >= minObservationCount);
		attachmentIds = [
			await buildAndUploadDailySongChart(
				mastoClient,
				whenString,
				dayData,
				logger,
			),
		];
	}

	const birdsStatus = await postToMastodon(
		mastoClient,
		postString,
		visibility,
		undefined,
		attachmentIds,
	);

	logger.info(`Posted bird list to ${birdsStatus.url} / ${birdsStatus.id}`);

	const ambientWeatherConfig: AmbientWeatherApiConfig = {
		apiBaseUrl: AWNBaseUrl,
		apiKey: AWNApiKey,
		applicationKey: AWNApplicationKey,
		deviceMac: AWNDeviceMac,
	};

	const weatherSummary = await buildWeatherSummaryForDay(
		ambientWeatherConfig,
		{ latitude, longitude },
		when.toJSDate(),
	);

	const weatherStatus = await postToMastodon(
		mastoClient,
		weatherSummary,
		visibility,
		birdsStatus.id,
	);
	logger.info(
		`Posted weather status to ${weatherStatus.url} / ${weatherStatus.id}`,
	);
};
