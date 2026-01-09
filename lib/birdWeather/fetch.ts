import { ApolloClient, type MaybeMasked } from "@apollo/client";
import type { BirdRecord } from "../haiku";
import { initBirdWeatherClient } from "./client";

import QueryResult = ApolloClient.QueryResult;

import type {
	AllDetectionsInPeriodQuery,
	AllDetectionsInPeriodQueryVariables,
	AllSpeciesDetectionsInPeriodQuery,
	AllSpeciesDetectionsInPeriodQueryVariables,
	SpeciesInfoByIdQuery,
	SpeciesInfoByIdQueryVariables,
	StationInfoQuery,
	StationInfoQueryVariables,
} from "./codegen/graphql";
import {
	allDetectionsInPeriodQuery,
	allSpeciesDetectionsInPeriodQuery,
	speciesInfoByIdQuery,
	stationInfoQuery,
} from "./queries";

/**
 * Fetch birds for a given day, by analog with same-named function for Haikubox
 *
 * Uses paginated detections as dailyDetectionCounts is unreliable
 *
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

type ObservationRecord = Exclude<
	Exclude<
		AllDetectionsInPeriodQuery["detections"]["edges"],
		null | undefined
	>[number],
	null | undefined
>["node"];

async function fetchAllObservationsForDay(
	apiUrl: string,
	stationId: string,
	dateOfInterest: string,
	minConfidence: number = 0,
): Promise<ObservationRecord[]> {
	const client = initBirdWeatherClient(apiUrl);

	let hasNextPage: boolean = true;
	let previousEndCursor: string | null | undefined;
	const nodes: ObservationRecord[] = [];

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
					nodes.push(e.node);
				}
			});

			({ hasNextPage, endCursor: previousEndCursor } = pageInfo);
		} else {
			break;
		}
	} while (hasNextPage);

	return nodes;
}

async function fetchSpeciesObservationsForDay(
	apiUrl: string,
	stationId: string,
	speciesId: string,
	dateOfInterest: string,
	minConfidence: number = 0,
): Promise<ObservationRecord[]> {
	const client = initBirdWeatherClient(apiUrl);

	let hasNextPage: boolean = true;
	let previousEndCursor: string | null | undefined;
	const nodes: ObservationRecord[] = [];

	let res: QueryResult<MaybeMasked<AllDetectionsInPeriodQuery>>;
	do {
		const variables = {
			stationId,
			speciesId,
			from: dateOfInterest,
			to: dateOfInterest,
			after: previousEndCursor,
		};

		// console.log({ variables });

		res = await client.query<
			AllSpeciesDetectionsInPeriodQuery,
			AllSpeciesDetectionsInPeriodQueryVariables
		>({
			query: allSpeciesDetectionsInPeriodQuery,
			variables: variables,
			// NOTE: from, to are DATE not DATE-TIME!
		});

		const detectionResult = res.data?.detections;

		if (detectionResult) {
			const { pageInfo, edges } = detectionResult;
			const observationEdges = edges ?? [];
			observationEdges.forEach((e) => {
				if (e?.node && e.node.confidence >= minConfidence) {
					nodes.push(e.node);
					// console.log({ node: e.node });
				}
			});

			({ hasNextPage, endCursor: previousEndCursor } = pageInfo);
		} else {
			break;
		}
	} while (hasNextPage);

	return nodes;
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

/**
 * Fetch various info about a species (see speciesInfoByIdQuery)
 *
 * @param apiUrl
 * @param speciesId
 */
async function fetchSpeciesInfo(
	apiUrl: string,
	speciesId: number,
): Promise<SpeciesInfoByIdQuery> {
	const client = initBirdWeatherClient(apiUrl);
	const speciesInfo = await client.query<
		SpeciesInfoByIdQuery,
		SpeciesInfoByIdQueryVariables
	>({
		query: speciesInfoByIdQuery,
		variables: { speciesId: `${speciesId}` },
	});

	if (!speciesInfo.data) {
		throw new Error(
			speciesInfo?.error?.message ?? "Could not load species info",
		);
	}

	return speciesInfo.data;
}

export {
	fetchAllObservationsForDay,
	fetchDailyCount,
	fetchSpeciesInfo,
	fetchSpeciesObservationsForDay,
	fetchStationInfo,
};
