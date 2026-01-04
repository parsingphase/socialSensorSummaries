import type pino from "pino";
import type { ImageSpecFromBuffer } from "../../lib/atproto";
import {
	drawChartFromDailySongData,
	type Offsets,
} from "../../lib/charts/barChart";
import type { BirdRecord } from "../../lib/haiku";
import { seenBirds } from "../../lib/sightings";

/**
 * Build the list of most-seen birds into a post
 *
 * @param birds
 * @param maxBirds
 * @param maxPostLength
 * @param confirmedObservations
 * @param textSubstitutions
 */
function buildTopBirdsPostText(
	birds: { bird: string; count: number }[],
	maxBirds: number,
	confirmedObservations: string[] | undefined,
	maxPostLength: number,
	textSubstitutions: SummaryPostTextSubstitutions,
): string {
	const { sourceTag, shortLocation, caveatText } = textSubstitutions;

	// sorted by default, but let's be sure
	birds.sort((a, b) => b.count - a.count);

	let postText = `#YesterdaysYardBirds top ${maxBirds} 🤖 ${shortLocation}:\n`; // FIXME parameterize
	const fixedTags = "\n\n#Birds #BirdsongDetection";
	let unverifiedBirds = 0;
	let firstUnverifiedBirdIndex: number | null = null;
	let caveatAppendedText = "";

	const optionalTag = sourceTag ? ` ${sourceTag}` : null;
	const candidateLines: string[] = [];
	const normalizeBirdName = (n: string): string =>
		n.replace(/^[a-z]+/g, "").toLowerCase();
	const normalizedSeenBirds = (confirmedObservations || []).map(
		normalizeBirdName,
	);

	/**
	 * Build single count row
	 * @param index
	 * @param bird
	 */
	function buildLine(index: number, bird: string): string {
		let line = `${index + 1} ${bird}`;
		if (caveatText && !normalizedSeenBirds.includes(normalizeBirdName(bird))) {
			line += " ^";
			unverifiedBirds++;
			if (!firstUnverifiedBirdIndex) {
				firstUnverifiedBirdIndex = index;
			}
		}
		return line;
	}

	birds
		.slice(0, maxBirds)
		// biome-ignore lint/suspicious: FIXME cleanup (map, don't push)
		.forEach(({ bird }, index) => candidateLines.push(buildLine(index, bird)));

	if (unverifiedBirds > 0 && caveatText) {
		caveatAppendedText = caveatText;
	}

	let maxBirdIndexIncluded = 0;
	for (let i = 0; i < candidateLines.length; i++) {
		if (
			postText.length +
				candidateLines[i].length +
				fixedTags.length +
				caveatAppendedText.length <
			maxPostLength
		) {
			postText += `\n${candidateLines[i]}`;
			maxBirdIndexIncluded = i;
		} else {
			break;
		}
	}

	if (
		firstUnverifiedBirdIndex !== null &&
		maxBirdIndexIncluded >= firstUnverifiedBirdIndex
	) {
		postText += caveatAppendedText;
	}

	postText += fixedTags;

	if ((postText + optionalTag).length <= maxPostLength) {
		postText += optionalTag;
	}

	return postText;
}

function buildInfoPostText(shortLocation: string, info: string) {
	return `#YesterdaysYardBirds 🤖 ${shortLocation}:
		
${info}
`;
}

/**
 * Build bar chart to attach to post (if data available)
 *
 * @param birds
 * @param maxBirds
 * @param whenString
 * @param source
 * @param logger
 */
function buildBarChartForPost(
	birds: BirdRecord[] | null,
	maxBirds: number,
	whenString: string,
	source: string,
	logger: pino.Logger,
): ImageSpecFromBuffer[] {
	let images: ImageSpecFromBuffer[] = [];
	if (birds && birds.length > 0) {
		const dayData = birds.slice(0, maxBirds);

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

type PostTextWithImages = { text: string; imageData: ImageSpecFromBuffer[] };

type SummaryPostTextSubstitutions = {
	shortLocation: string;
	dateString: string;
	caveatText: string;
	sourceName: string;
	sourceTag: string;
};

/**
 * Build all post content that's consistent across platforms, ie text & images
 *
 * @param birds
 * @param minObservationCount
 * @param maxSpeciesInSummary
 * @param maxPostLength
 * @param textSubstitutions
 * @param logger
 */
function buildDailySummaryPostContent(
	birds: BirdRecord[],
	minObservationCount: number,
	maxSpeciesInSummary: number,
	maxPostLength: number,
	textSubstitutions: SummaryPostTextSubstitutions,
	logger: pino.Logger,
): PostTextWithImages {
	const filteredBirds = birds.filter((b) => b.count >= minObservationCount);
	let postString: string;
	let images: ImageSpecFromBuffer[] = [];
	if (filteredBirds?.length) {
		// Build happy-path text
		postString = buildTopBirdsPostText(
			birds || [],
			maxSpeciesInSummary,
			seenBirds,
			maxPostLength,
			textSubstitutions,
		);
		logger.info(
			{
				birds,
				postString,
				length: postString.length,
				sourceName: textSubstitutions.sourceName,
			},
			`${textSubstitutions.sourceName} Chart`,
		);
		images = buildBarChartForPost(
			birds,
			maxSpeciesInSummary,
			textSubstitutions.dateString,
			`from ${textSubstitutions.sourceName}`,
			logger,
		);
	} else if (birds?.length) {
		const info = `Insufficient observations were made by ${textSubstitutions.sourceName} to generate a report.  
To avoid posting spurious reports, each species must be heard at least ${minObservationCount} times in the day.`;
		postString = buildInfoPostText(textSubstitutions.shortLocation, info);
		logger.error(
			`No birds detected over threshold - ${textSubstitutions.sourceName} may be impaired?`,
		);
	} else {
		const info = `Not a peep!
No birds detected, even below threshold. ${textSubstitutions.sourceName} may be offline?`;
		postString = buildInfoPostText(textSubstitutions.shortLocation, info);

		logger.error(
			`No birds detected - ${textSubstitutions.sourceName} may be offline?`,
		);
	}
	return { text: postString, imageData: images };
}

export { buildDailySummaryPostContent };

export type { PostTextWithImages, SummaryPostTextSubstitutions };
