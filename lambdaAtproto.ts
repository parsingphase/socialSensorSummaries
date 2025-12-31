import type { AtpAgent } from "@atproto/api";
import type { Context, ScheduledEvent } from "aws-lambda";
import { DateTime, Duration } from "luxon";
import pino from "pino";
import { buildBirdPostForBluesky } from "./core/haiku2bluesky";
import {
	getAtprotoAgent,
	type ImageSpecFromBuffer,
	type Link,
	postToAtproto,
	type StrongPostRef,
} from "./lib/atproto";
import { fetchDailyCount as fetchDailyCountFromBirdWeatherApi } from "./lib/birdWeather";
import {
	drawChartFromDailySongData,
	type Offsets,
} from "./lib/charts/barChart";
import {
	type BirdRecord,
	fetchDailyCount as fetchDailyCountFromHaikuboxApi,
} from "./lib/haiku";
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
	logger: pino.Logger,
): ImageSpecFromBuffer[] {
	let images: ImageSpecFromBuffer[] = [];
	if (birds && birds.length > 0) {
		const dayData = birds
			.slice(0, maxBirds)
			.filter((b) => b.count >= minObservationCount);

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
			source,
		);
		const alt = ["Bar chart of the above data:", ""];

		for (const bird of dayData) {
			alt.push(
				`${bird.bird}: ${bird.count} call${bird.count === 1 ? "" : "s"}`,
			);
		}
		images = [
			{
				data: imageBuffer,
				alt: alt.join("\n"),
				width,
				height,
				mimetype: "image/png",
			},
		];
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
 * @param sourceTag Including #
 * @param client
 * @param replyRef
 */
async function postStatusFromBirdList(
	birds: BirdRecord[],
	logger: pino.Logger,
	whenString: string,
	source: string,
	sourceTag: string,
	client: AtpAgent,
	replyRef?: StrongPostRef,
): Promise<StrongPostRef> {
	let postString: string;
	const links: Link[] = [
		{
			uri: "https://bsky.app/profile/did:plc:jsjgrbio76yz7zzch5fsasox/post/3mb356jnlrs2c", // FIXME parameterize
			text: "caveat",
		},
	];
	let images: ImageSpecFromBuffer[] = [];

	if (birds?.length) {
		const maxBirds = 10;
		const minObservationCount = 10;

		postString = buildBirdPostForBluesky(
			birds || [],
			seenBirds,
			sourceTag,
			maxBirds,
			minObservationCount,
		);
		logger.info(
			{ birds, postString, length: postString.length, source },
			`${source} Chart`,
		);
		images = buildBarChartForPost(
			birds,
			maxBirds,
			minObservationCount,
			whenString,
			`from ${source}`,
			logger,
		);
	} else {
		postString = `#YesterdaysYardBirds 🤖 (NE MA):

Not a peep!

No birds detected, even below threshold. ${source} may be offline?
`;
		logger.error(`No birds detected - ${source} may be offline?`);
	}

	const birdsStatus = await postToAtproto(
		client,
		postString,
		replyRef,
		links,
		images,
		logger,
	);
	logger.info(
		`Posted ${source} bird list to ${birdsStatus.uri} / ${birdsStatus.cid}`,
	);
	return birdsStatus;
}

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
	const whenString = when.toFormat("yyyy-MM-dd");

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
		whenString,
	);
	const bwStatus = await postStatusFromBirdList(
		bwBirds ?? [],
		logger,
		whenString,
		"BirdWeather PUC",
		"#BirdWeather",
		client,
	);

	// Haikubox Post Generation
	const birds = await fetchDailyCountFromHaikuboxApi(
		haikuBaseUrl,
		haikuSerialNumber,
		whenString,
	);

	const haikuboxStatus = await postStatusFromBirdList(
		birds ?? [],
		logger,
		whenString,
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
