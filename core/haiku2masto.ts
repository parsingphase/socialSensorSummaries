import type pino from "pino";
import {
	drawChartFromDailySongData,
	type Offsets,
} from "../lib/charts/barChart";
import type { BirdRecord } from "../lib/haiku";
import type {
	CreateStatusParams,
	MastoClient,
	Status,
	StatusVisibility,
} from "../lib/masto/types";

/**
 * Build daily summary string
 *
 * @param birds
 * @param shortLocation
 * @param confirmedObservations
 * @param maxBirds
 * @param maxPostLength
 */
function buildBirdPostForMastodon(
	birds: { bird: string; count: number }[],
	shortLocation: string,
	confirmedObservations?: string[],
	maxBirds = 20,
	maxPostLength = 500,
): string {
	const caveatUrl = "https://m.phase.org/@parsingphase/111711558681612429";
	const caveatText = `\n\n ^ caveat: ${caveatUrl}`;

	return buildTopBirdsPostText(
		birds,
		shortLocation,
		maxBirds,
		maxPostLength,
		confirmedObservations,
		caveatText,
	);
}

/**
 * Post plain string to mastodon
 *

 * @param masto
 * @param postString
 * @param postVisibility
 * @param inReplyToId
 * @param mediaIds
 */
async function postToMastodon(
	masto: MastoClient,
	postString: string,
	postVisibility: string,
	inReplyToId?: string,
	mediaIds: string[] = [],
): Promise<Status> {
	console.log(`Logged in…`);

	const statusParams: CreateStatusParams = {
		status: postString,
		visibility: postVisibility as StatusVisibility,
		...(inReplyToId ? { inReplyToId } : {}),
		...(mediaIds ? { mediaIds } : {}),
	};

	console.log({ statusParams });

	return masto.v1.statuses.create(statusParams);
}

/**
 * Build and upload chart, and return attachment Id
 * @param mastoClient
 * @param whenString
 * @param dayData
 * @param logger
 */
async function buildAndUploadDailySongChart(
	mastoClient: MastoClient,
	whenString: string,
	dayData: BirdRecord[],
	logger: pino.Logger,
): Promise<string> {
	const width = 1200;
	const height = 1200;

	const offsets: Offsets = {
		top: Math.round(height / 10),
		left: Math.round(width / 4),
		bottom: Math.round(height / 12.5),
		right: Math.round(width / 25),
	};

	const imageBuffer: Buffer = drawChartFromDailySongData(
		dayData,
		whenString,
		width,
		height,
		offsets,
	);
	const alt = ["Bar chart of the above data:", ""];

	for (const bird of dayData) {
		alt.push(`${bird.bird}: ${bird.count} call${bird.count === 1 ? "" : "s"}`);
	}
	// images = [{ data: imageBuffer, alt: alt.join("\n"), width, height, mimetype: "image/png" }];
	logger.info("Image created");
	const attachment = await mastoClient.v2.media.create({
		file: new Blob([new Uint8Array(imageBuffer)]),
		description: alt.join("\n"),
	});
	return attachment.id;
}

export {
	buildAndUploadDailySongChart,
	buildBirdPostForMastodon,
	postToMastodon,
};
