import type { AtpAgent } from "@atproto/api";
import type { Context, ScheduledEvent } from "aws-lambda";
import {
	getAtprotoAgent,
	type Link,
	postToAtproto,
	type StrongPostRef,
} from "lib/atproto";
import {
	buildDailySummaryPostContent,
	type SummaryPostTextSubstitutions,
} from "lib/birdObservations/buildBirdObservationSummaryPost";
import { fetchDailyCount as fetchDailyCountFromBirdWeatherApi } from "lib/birdWeather";
import { assertedEnvVar } from "lib/configTools";
import {
	type BirdRecord,
	fetchDailyCount as fetchDailyCountFromHaikuboxApi,
} from "lib/haiku";
import {
	type AmbientWeatherApiConfig,
	buildWeatherSummaryForDay,
} from "lib/weather";
import { DateTime, Duration } from "luxon";
import pino from "pino";

type LambdaConfig = {
	blueskyUsername: string;
	blueskyPassword: string;
	blueskyServerBaseUrl: string;
	haikuSerialNumber: string;
	haikuBaseUrl: string;
	birdWeatherStationId: string;
	birdWeatherBaseUrl: string;
	AWNBaseUrl: string;
	AWNApiKey: string;
	AWNApplicationKey: string;
	AWNDeviceMac: string;
	latitude: number;
	longitude: number;
};

function getConfigFromEnv(): LambdaConfig {
	const blueskyUsername = assertedEnvVar("BLUESKY_USERNAME");
	const blueskyPassword = assertedEnvVar("BLUESKY_PASSWORD");
	const blueskyServerBaseUrl = assertedEnvVar("BLUESKY_BASE_URL");

	const haikuSerialNumber = assertedEnvVar("HAIKU_SERIAL_NUMBER");
	const haikuBaseUrl = assertedEnvVar("HAIKU_BASE_URL");

	const birdWeatherStationId = assertedEnvVar("BIRDWEATHER_STATION_ID");
	const birdWeatherBaseUrl = assertedEnvVar("BIRDWEATHER_BASE_URL");

	const AWNBaseUrl = assertedEnvVar("AWN_BASE_URL");
	const AWNApiKey = assertedEnvVar("AWN_API_KEY");
	const AWNApplicationKey = assertedEnvVar("AWN_APPLICATION_KEY");
	const AWNDeviceMac = assertedEnvVar("AWN_DEVICE_MAC");

	const latitude = Number(assertedEnvVar("SITE_LATITUDE"));
	const longitude = Number(assertedEnvVar("SITE_LONGITUDE"));
	return {
		blueskyUsername,
		blueskyPassword,
		blueskyServerBaseUrl,
		haikuSerialNumber,
		haikuBaseUrl,
		birdWeatherStationId,
		birdWeatherBaseUrl,
		AWNBaseUrl,
		AWNApiKey,
		AWNApplicationKey,
		AWNDeviceMac,
		latitude,
		longitude,
	};
}

async function executeWithConfig(config: LambdaConfig): Promise<void> {
	const {
		blueskyUsername,
		blueskyPassword,
		blueskyServerBaseUrl,
		haikuSerialNumber,
		haikuBaseUrl,
		birdWeatherStationId,
		birdWeatherBaseUrl,
		AWNBaseUrl,
		AWNApiKey,
		AWNApplicationKey,
		AWNDeviceMac,
		latitude,
		longitude,
	} = config;

	// Post setup
	const when = DateTime.now().minus(Duration.fromObject({ days: 1 }));
	const dateString = when.toFormat("yyyy-MM-dd");

	const logger = pino({});

	const client = await getAtprotoAgent(
		blueskyServerBaseUrl,
		blueskyUsername,
		blueskyPassword,
		logger,
	);

	// Birdweather Post Generation
	const bwBirds = await fetchDailyCountFromBirdWeatherApi(
		birdWeatherBaseUrl,
		birdWeatherStationId,
		dateString,
	);
	const bwStatus = await postStatusFromBirdList(
		bwBirds ?? [],
		logger,
		dateString,
		"BirdWeather PUC",
		"#BirdWeather",
		client,
	);

	// Haikubox Post Generation
	const haikuBirds = await fetchDailyCountFromHaikuboxApi(
		haikuBaseUrl,
		haikuSerialNumber,
		dateString,
	);

	const haikuboxStatus = await postStatusFromBirdList(
		haikuBirds ?? [],
		logger,
		dateString,
		"Haikubox",
		"#Haikubox",
		client,
		bwStatus,
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
		when.toJSDate(),
	);

	const weatherStatus = await postToAtproto(
		client,
		weatherSummary,
		bwStatus,
		undefined,
		undefined,
		logger,
	);
	logger.info(
		`Posted weather status to ${weatherStatus.uri} / ${weatherStatus.cid}`,
	);
}

/**
 * Build & post text & image from provided data, ie one song monitor's daily output
 *
 * @param birds
 * @param logger
 * @param dateString
 * @param sourceName
 * @param sourceTag Including #
 * @param client
 * @param replyRef
 */
async function postStatusFromBirdList(
	birds: BirdRecord[],
	logger: pino.Logger,
	dateString: string,
	sourceName: string,
	sourceTag: string,
	client: AtpAgent,
	replyRef?: StrongPostRef,
): Promise<StrongPostRef> {
	const links: Link[] = [
		{
			uri: "https://bsky.app/profile/did:plc:jsjgrbio76yz7zzch5fsasox/post/3mb356jnlrs2c", // FIXME parameterize
			text: "caveat",
		},
	];
	const shortLocation = `(NE MA)`; // FIXME move this to config
	const caveatText = `\n\n ^ See caveat`;
	const maxPostLength = 300;
	const maxBirds = 10;
	const minObservationCount = 10;

	const textSubstitutions: SummaryPostTextSubstitutions = {
		shortLocation,
		dateString,
		sourceName,
		sourceTag,
		caveatText,
	};

	const { text, imageData } = buildDailySummaryPostContent(
		birds,
		minObservationCount,
		maxBirds,
		maxPostLength,
		textSubstitutions,
		logger,
	);

	const birdsStatus = await postToAtproto(
		client,
		text,
		replyRef,
		links,
		imageData,
		logger,
	);
	logger.info(
		`Posted ${sourceName} bird list to ${birdsStatus.uri} / ${birdsStatus.cid}`,
	);
	return birdsStatus;
}

/**
 * Handler used by AWS to execute the lambda
 *
 * Should just build config then execute the main function, to make CLI usage simpler
 * @param _event
 * @param _context
 */
export const handler = async (
	_event: ScheduledEvent,
	_context: Context,
): Promise<void> => {
	void _event;
	void _context;

	// Environmental setup
	const configFromEnv = getConfigFromEnv();
	await executeWithConfig(configFromEnv);
};

export { executeWithConfig, type LambdaConfig };
