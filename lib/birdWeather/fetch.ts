import { ApolloClient, type MaybeMasked } from "@apollo/client";
import type { BirdRecord } from "../haiku";
import { initBirdWeatherClient } from "./client";

import QueryResult = ApolloClient.QueryResult;

import type {
	AllDetectionsInPeriodQuery,
	AllDetectionsInPeriodQueryVariables,
	StationInfoQuery,
	StationInfoQueryVariables,
} from "./codegen/graphql";
import { allDetectionsInPeriodQuery, stationInfoQuery } from "./queries";

/**
 * Fetch birds for a given day, by analog with same-named function for Haikubox
 * @param apiUrl
 * @param stationId
 * @param dateOfInterest
 * @param minConfidence
 */
async function fetchDailyCount(
	apiUrl: string,
	stationId: string,
	dateOfInterest: string,
	minConfidence: number = 0,
): Promise<BirdRecord[]> {
	const client = initBirdWeatherClient(apiUrl);
	const countBySpecies: Record<string, number> = {};

	let hasNextPage: boolean = true;
	let previousEndCursor: string | null | undefined;

	let res: QueryResult<MaybeMasked<AllDetectionsInPeriodQuery>>;
	do {
		res = await client.query<
			AllDetectionsInPeriodQuery,
			AllDetectionsInPeriodQueryVariables
		>({
			query: allDetectionsInPeriodQuery,
			variables: {
				stationId: stationId,
				from: dateOfInterest,
				to: dateOfInterest,
				after: previousEndCursor,
			},
			// NOTE: from, to are DATE not DATE-TIME!
		});
		const detectionResult = res.data?.detections;

		if (detectionResult) {
			const { pageInfo, edges } = detectionResult;
			const observationEdges = edges ?? [];
			observationEdges.forEach((e) => {
				if (e?.node && e.node.confidence >= minConfidence) {
					countBySpecies[e.node.species.commonName] =
						(countBySpecies[e.node.species.commonName] ?? 0) + 1;
				}
			});

			({ hasNextPage, endCursor: previousEndCursor } = pageInfo);
		} else {
			break;
		}
	} while (hasNextPage);

	const birdRecords: BirdRecord[] = [];
	for (const key in countBySpecies) {
		birdRecords.push({ bird: key, count: countBySpecies[key] });
	}

	return birdRecords.sort((a, b) => b.count - a.count);
}

/**
 * Fetch various info about a station (see stationInfoQuery)
 *
 * @param apiUrl
 * @param stationId
 */
async function fetchStationInfo(
	apiUrl: string,
	stationId: number,
): Promise<StationInfoQuery> {
	const client = initBirdWeatherClient(apiUrl);
	const stationInfo = await client.query<
		StationInfoQuery,
		StationInfoQueryVariables
	>({
		query: stationInfoQuery,
		variables: { stationId: `${stationId}` },
	});

	if (!stationInfo.data) {
		throw new Error(
			stationInfo?.error?.message ?? "Could not load station info",
		);
	}

	return stationInfo.data;
}

export { fetchDailyCount, fetchStationInfo };
