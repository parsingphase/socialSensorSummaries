#!/usr/bin/env npx tsx -r tsconfig-paths/register

// TODO rewrite this to just call the lambda

import { DateTime, Duration } from "luxon";
import { createRestAPIClient } from "masto";
import pino from "pino";
import { config } from "./config/config";
import {
	buildAndUploadDailySongChart,
	buildBirdPostForMastodon,
	postToMastodon,
} from "./core/haiku2masto";
import { fetchDailyCount } from "./lib/haiku";
import type { MastoClient, Status } from "./lib/masto/types";
import { seenBirds } from "./lib/sightings";
import { buildWeatherSummaryForDay } from "./lib/weather";

/**
 * CLI main loop
 */
async function main(): Promise<void> {
	const logger = pino({});

	const post = true;

	const whenLuxon = DateTime.now().minus(Duration.fromObject({ days: 1 }));
	// const whenLuxon = DateTime.now(); // for testing
	const when = whenLuxon.toFormat("yyyy-MM-dd");
	const { serialNumber, apiBaseUrl: haikuBaseUrl } = config.haikubox;
	const birds = await fetchDailyCount(haikuBaseUrl, serialNumber, when);

	const listLength = 20;
	const {
		apiClientToken,
		apiBaseUrl: mastoBaseUrl,
		maxPostLength,
	} = config.mastodon;
	const minObservationCount = 10;
	const postString = buildBirdPostForMastodon(
		birds || [],
		seenBirds,
		listLength,
		minObservationCount,
		maxPostLength,
	);

	const mastoClient: MastoClient = createRestAPIClient({
		url: mastoBaseUrl,
		accessToken: apiClientToken,
	});

	const { postVisibility } = config.lambda.dev;

	let birdsStatus: Status | null = null;
	if (post) {
		let attachmentIds: string[] = [];
		if (birds && birds.length > 0) {
			const dayData = birds
				.slice(0, listLength)
				.filter((b) => b.count >= minObservationCount);
			attachmentIds = [
				await buildAndUploadDailySongChart(mastoClient, when, dayData, logger),
			];
			logger.info({ attachmentIds }, "Uploaded attachments");
		}
		birdsStatus = await postToMastodon(
			mastoClient,
			postString,
			postVisibility,
			undefined,
			attachmentIds,
		);
		logger.info(`Posted bird list to ${birdsStatus.url} / ${birdsStatus.id}`);
	} else {
		logger.info({ postString });
	}

	const location = config.location;
	const ambientWeatherConfig = config.ambientWeather;
	const weatherSummary = await buildWeatherSummaryForDay(
		ambientWeatherConfig,
		location,
		whenLuxon.toJSDate(),
	);

	if (post) {
		const weatherStatus = await postToMastodon(
			mastoClient,
			weatherSummary,
			postVisibility,
			birdsStatus?.id || "unused",
		);
		logger.info(
			`Posted weather status to ${weatherStatus.url} / ${weatherStatus.id}`,
		);
	} else {
		logger.info({ weatherSummary });
	}
}

main().finally(() => console.log("DONE"));
