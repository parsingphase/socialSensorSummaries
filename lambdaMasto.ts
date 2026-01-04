import type { Context, ScheduledEvent } from "aws-lambda";
import { DateTime, Duration } from "luxon";
import { createRestAPIClient } from "masto";
import pino from "pino";
import {
	buildDailySummaryPostContent,
	type SummaryPostTextSubstitutions,
} from "./lib/birdObservations/buildBirdObservationSummaryPost";
import { fetchDailyCount as fetchDailyCountFromBirdWeatherApi } from "./lib/birdWeather";
import { assertedEnvVar } from "./lib/configTools";
import {
	type BirdRecord,
	fetchDailyCount as fetchDailyCountFromHaikuboxApi,
} from "./lib/haiku";
import {
	createAttachmentFromImageData,
	postToMastodon,
	type SimpleMastoAttachment,
} from "./lib/masto";
import type { MastoClient, Status, StatusVisibility } from "./lib/masto/types";
import {
	type AmbientWeatherApiConfig,
	buildWeatherSummaryForDay,
} from "./lib/weather";

type LambdaConfig = {
	mastoToken: string;
	mastoBaseUrl: string;
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
	visibility: StatusVisibility;
};

function getConfigFromEnv(): LambdaConfig {
	const mastoToken = assertedEnvVar("MASTO_CLIENT_TOKEN");
	const mastoBaseUrl = assertedEnvVar("MASTO_BASE_URL");

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

	const visibility = (process.env.POST_VISIBILITY ||
		"direct") as StatusVisibility;
	return {
		mastoToken,
		mastoBaseUrl,
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
		visibility,
	};
}

async function executeWithConfig(config: LambdaConfig) {
	const {
		mastoToken,
		mastoBaseUrl,
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
		visibility,
	} = config;

	// Post setup
	const when = DateTime.now().minus(Duration.fromObject({ days: 1 }));
	const dateString = when.toFormat("yyyy-MM-dd");

	const logger = pino({});

	const client: MastoClient = createRestAPIClient({
		url: mastoBaseUrl,
		accessToken: mastoToken,
	});

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
		visibility,
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
		visibility,
		client,
		bwStatus.id,
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

	const weatherStatus = await postToMastodon(
		client,
		weatherSummary,
		visibility,
		bwStatus.id,
	);
	logger.info(
		`Posted weather status to ${weatherStatus.url} / ${weatherStatus.id}`,
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
 * @param visibility
 * @param client
 * @param replyRef
 */
async function postStatusFromBirdList(
	birds: BirdRecord[],
	logger: pino.Logger,
	dateString: string,
	sourceName: string,
	sourceTag: string,
	visibility: StatusVisibility,
	client: MastoClient,
	replyRef?: string,
): Promise<Status> {
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

	let imageAttachment: SimpleMastoAttachment | undefined;
	if (imageData?.length) {
		imageAttachment = await createAttachmentFromImageData(
			client,
			imageData[0].data,
			imageData[0].alt,
		);
	}

	const birdsStatus = await postToMastodon(
		client,
		text,
		visibility,
		replyRef,
		imageAttachment ? [imageAttachment.id] : [],
	);
	logger.info(
		`Posted ${sourceName} bird list to ${birdsStatus.uri} / ${birdsStatus.id}`,
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
