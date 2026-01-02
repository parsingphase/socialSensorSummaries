import type { Context, ScheduledEvent } from "aws-lambda";
import { DateTime, Duration } from "luxon";
import { createRestAPIClient } from "masto";
import pino from "pino";
import { buildInfoPostText } from "./core/buildPost";
import {
	buildAndUploadDailySongChart,
	buildBirdPostForMastodon,
	postToMastodon,
} from "./core/haiku2masto";
import { fetchDailyCount } from "./lib/haiku";
import type { MastoClient, StatusVisibility } from "./lib/masto/types";
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
		throw new Error(`Must set ${key}`);
	}
	return token;
}

type LambdaConfig = {
	mastoToken: string;
	mastoBaseUrl: string;
	haikuSerialNumber: string;
	haikuBaseUrl: string;
	// birdWeatherStationId: string;
	// birdWeatherBaseUrl: string;
	AWNBaseUrl: string;
	AWNApiKey: string;
	AWNApplicationKey: string;
	AWNDeviceMac: string;
	latitude: number;
	longitude: number;
	visibility: StatusVisibility;
};

function getConfigFromEnv(): LambdaConfig {
	const mastoToken = assertedEnvVar("MASTO_CLIENT_TOKEN");
	const mastoBaseUrl = assertedEnvVar("MASTO_BASE_URL");

	const haikuSerialNumber = assertedEnvVar("HAIKU_SERIAL_NUMBER");
	const haikuBaseUrl = assertedEnvVar("HAIKU_BASE_URL");

	const AWNBaseUrl = assertedEnvVar("AWN_BASE_URL");
	const AWNApiKey = assertedEnvVar("AWN_API_KEY");
	const AWNApplicationKey = assertedEnvVar("AWN_APPLICATION_KEY");
	const AWNDeviceMac = assertedEnvVar("AWN_DEVICE_MAC");

	const latitude = Number(assertedEnvVar("SITE_LATITUDE"));
	const longitude = Number(assertedEnvVar("SITE_LONGITUDE"));

	const visibility = (process.env.POST_VISIBILITY ||
		"direct") as StatusVisibility;
	return {
		mastoToken,
		mastoBaseUrl,
		haikuSerialNumber,
		haikuBaseUrl,
		AWNBaseUrl,
		AWNApiKey,
		AWNApplicationKey,
		AWNDeviceMac,
		latitude,
		longitude,
		visibility,
	};
}

async function executeWithConfig(configFromEnv: LambdaConfig) {
	const {
		mastoToken,
		mastoBaseUrl,
		haikuSerialNumber,
		haikuBaseUrl,
		AWNBaseUrl,
		AWNApiKey,
		AWNApplicationKey,
		AWNDeviceMac,
		latitude,
		longitude,
		visibility,
	} = configFromEnv;

	const when = DateTime.now().minus(Duration.fromObject({ days: 1 }));
	const whenString = when.toFormat("yyyy-MM-dd");
	const maxBirds = 20;
	const minObservationCount = 10;
	const shortLocation = `(NE MA)`; // FIXME move this to config

	const allBirds =
		(await fetchDailyCount(haikuBaseUrl, haikuSerialNumber, whenString)) || [];

	// Filter at a common external location to avoid duplication and simplify logic
	const filteredBirds = allBirds.filter((b) => b.count >= minObservationCount);

	const mastoClient: MastoClient = createRestAPIClient({
		url: mastoBaseUrl,
		accessToken: mastoToken,
	});
	const logger = pino({});

	let postString: string;
	let attachmentIds: string[] = [];

	if (filteredBirds?.length) {
		postString = buildBirdPostForMastodon(
			filteredBirds,
			shortLocation,
			seenBirds,
			maxBirds,
		);

		logger.info({
			birds: filteredBirds,
			postString,
			length: postString.length,
		});

		const dayData = filteredBirds
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
	} else if (allBirds?.length) {
		const info = `Insufficient observations were made to generate a report.  
To avoid posting spurious reports, each species must be heard at least ${minObservationCount} times in the day.`;
		postString = buildInfoPostText(shortLocation, info);
		logger.error(
			"No birds detected over threshold - HaikuBox may be impaired?",
		);
	} else {
		const info = `Not a peep!
No birds detected, even below threshold. HaikuBox may be offline?`;
		postString = buildInfoPostText(shortLocation, info);

		logger.error("No birds detected - HaikuBox may be offline?");
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
}

export const handler = async (
	_event: ScheduledEvent,
	_context: Context,
): Promise<void> => {
	void _event;
	void _context;
	const configFromEnv = getConfigFromEnv();
	await executeWithConfig(configFromEnv);
};

export { executeWithConfig, type LambdaConfig };
