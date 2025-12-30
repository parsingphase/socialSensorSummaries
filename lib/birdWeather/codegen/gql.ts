/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  query DailyDetections($stationId: ID!, $days: Int!) {\n    dailyDetectionCounts(stationIds: [$stationId], period: { count: $days, unit: \"day\" }) {\n      date\n      dayOfYear\n      counts {\n        count\n        species {\n          alpha\n          commonName\n        }\n      }\n    }\n  }\n": typeof types.DailyDetectionsDocument,
    "\n  query AllDetectionsInPeriod(\n    $stationId: ID!\n    $from: ISO8601Date!\n    $to: ISO8601Date!\n    $after: String\n  ) {\n    detections(stationIds: [$stationId], period: { from: $from, to: $to }, after: $after) {\n      pageInfo {\n        startCursor\n        endCursor\n        hasNextPage\n        hasPreviousPage\n      }\n      edges {\n        cursor\n        node {\n          timestamp\n          species {\n            commonName\n          }\n          confidence\n          probability\n          score\n        }\n      }\n    }\n  }\n": typeof types.AllDetectionsInPeriodDocument,
    "\nquery BucketSpeciesObservations($speciesId: ID!, $stationId: ID!, $fromDate: ISO8601Date!, $toDate: ISO8601Date!, $bucketMinutes: Int!) {\n  species(id: $speciesId) {\n    commonName\n    id\n    # period is *inclusive* days\n    detectionCounts(period:{from: $fromDate, to: $toDate}, group: $bucketMinutes, stationIds:[$stationId]) {\n      count\n      bins {\n           key\n           count\n         }\n      }\n   }\n}": typeof types.BucketSpeciesObservationsDocument,
    "\n\tquery StationInfo($stationId: ID!) {\n\t\tstation(id: $stationId) {\n\t\t\tid\n\t\t\tname\n\t\t\tstate\n\t\t\tcountry\n\t\t\tcontinent\n\t\t\tlocation\n\t\t\tlocationPrivacy\n\t\t\tcoords { \n\t\t\t lat, \n\t\t\t lon\n\t\t\t}\n\t\t\ttype\n\t\t\tearliestDetectionAt    \n\t\t\t}\n\t}\n": typeof types.StationInfoDocument,
    "\n\tquery SpeciesInfoById($speciesId: ID!){\n\t\tspecies(id: $speciesId) {\n\t\t\tid\n\t\t\talpha\n\t\t\tcommonName\n\t\t\tscientificName\n\t\t\tclassification \n\t\t}\n}\n": typeof types.SpeciesInfoByIdDocument,
};
const documents: Documents = {
    "\n  query DailyDetections($stationId: ID!, $days: Int!) {\n    dailyDetectionCounts(stationIds: [$stationId], period: { count: $days, unit: \"day\" }) {\n      date\n      dayOfYear\n      counts {\n        count\n        species {\n          alpha\n          commonName\n        }\n      }\n    }\n  }\n": types.DailyDetectionsDocument,
    "\n  query AllDetectionsInPeriod(\n    $stationId: ID!\n    $from: ISO8601Date!\n    $to: ISO8601Date!\n    $after: String\n  ) {\n    detections(stationIds: [$stationId], period: { from: $from, to: $to }, after: $after) {\n      pageInfo {\n        startCursor\n        endCursor\n        hasNextPage\n        hasPreviousPage\n      }\n      edges {\n        cursor\n        node {\n          timestamp\n          species {\n            commonName\n          }\n          confidence\n          probability\n          score\n        }\n      }\n    }\n  }\n": types.AllDetectionsInPeriodDocument,
    "\nquery BucketSpeciesObservations($speciesId: ID!, $stationId: ID!, $fromDate: ISO8601Date!, $toDate: ISO8601Date!, $bucketMinutes: Int!) {\n  species(id: $speciesId) {\n    commonName\n    id\n    # period is *inclusive* days\n    detectionCounts(period:{from: $fromDate, to: $toDate}, group: $bucketMinutes, stationIds:[$stationId]) {\n      count\n      bins {\n           key\n           count\n         }\n      }\n   }\n}": types.BucketSpeciesObservationsDocument,
    "\n\tquery StationInfo($stationId: ID!) {\n\t\tstation(id: $stationId) {\n\t\t\tid\n\t\t\tname\n\t\t\tstate\n\t\t\tcountry\n\t\t\tcontinent\n\t\t\tlocation\n\t\t\tlocationPrivacy\n\t\t\tcoords { \n\t\t\t lat, \n\t\t\t lon\n\t\t\t}\n\t\t\ttype\n\t\t\tearliestDetectionAt    \n\t\t\t}\n\t}\n": types.StationInfoDocument,
    "\n\tquery SpeciesInfoById($speciesId: ID!){\n\t\tspecies(id: $speciesId) {\n\t\t\tid\n\t\t\talpha\n\t\t\tcommonName\n\t\t\tscientificName\n\t\t\tclassification \n\t\t}\n}\n": types.SpeciesInfoByIdDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query DailyDetections($stationId: ID!, $days: Int!) {\n    dailyDetectionCounts(stationIds: [$stationId], period: { count: $days, unit: \"day\" }) {\n      date\n      dayOfYear\n      counts {\n        count\n        species {\n          alpha\n          commonName\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query DailyDetections($stationId: ID!, $days: Int!) {\n    dailyDetectionCounts(stationIds: [$stationId], period: { count: $days, unit: \"day\" }) {\n      date\n      dayOfYear\n      counts {\n        count\n        species {\n          alpha\n          commonName\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AllDetectionsInPeriod(\n    $stationId: ID!\n    $from: ISO8601Date!\n    $to: ISO8601Date!\n    $after: String\n  ) {\n    detections(stationIds: [$stationId], period: { from: $from, to: $to }, after: $after) {\n      pageInfo {\n        startCursor\n        endCursor\n        hasNextPage\n        hasPreviousPage\n      }\n      edges {\n        cursor\n        node {\n          timestamp\n          species {\n            commonName\n          }\n          confidence\n          probability\n          score\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query AllDetectionsInPeriod(\n    $stationId: ID!\n    $from: ISO8601Date!\n    $to: ISO8601Date!\n    $after: String\n  ) {\n    detections(stationIds: [$stationId], period: { from: $from, to: $to }, after: $after) {\n      pageInfo {\n        startCursor\n        endCursor\n        hasNextPage\n        hasPreviousPage\n      }\n      edges {\n        cursor\n        node {\n          timestamp\n          species {\n            commonName\n          }\n          confidence\n          probability\n          score\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\nquery BucketSpeciesObservations($speciesId: ID!, $stationId: ID!, $fromDate: ISO8601Date!, $toDate: ISO8601Date!, $bucketMinutes: Int!) {\n  species(id: $speciesId) {\n    commonName\n    id\n    # period is *inclusive* days\n    detectionCounts(period:{from: $fromDate, to: $toDate}, group: $bucketMinutes, stationIds:[$stationId]) {\n      count\n      bins {\n           key\n           count\n         }\n      }\n   }\n}"): (typeof documents)["\nquery BucketSpeciesObservations($speciesId: ID!, $stationId: ID!, $fromDate: ISO8601Date!, $toDate: ISO8601Date!, $bucketMinutes: Int!) {\n  species(id: $speciesId) {\n    commonName\n    id\n    # period is *inclusive* days\n    detectionCounts(period:{from: $fromDate, to: $toDate}, group: $bucketMinutes, stationIds:[$stationId]) {\n      count\n      bins {\n           key\n           count\n         }\n      }\n   }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery StationInfo($stationId: ID!) {\n\t\tstation(id: $stationId) {\n\t\t\tid\n\t\t\tname\n\t\t\tstate\n\t\t\tcountry\n\t\t\tcontinent\n\t\t\tlocation\n\t\t\tlocationPrivacy\n\t\t\tcoords { \n\t\t\t lat, \n\t\t\t lon\n\t\t\t}\n\t\t\ttype\n\t\t\tearliestDetectionAt    \n\t\t\t}\n\t}\n"): (typeof documents)["\n\tquery StationInfo($stationId: ID!) {\n\t\tstation(id: $stationId) {\n\t\t\tid\n\t\t\tname\n\t\t\tstate\n\t\t\tcountry\n\t\t\tcontinent\n\t\t\tlocation\n\t\t\tlocationPrivacy\n\t\t\tcoords { \n\t\t\t lat, \n\t\t\t lon\n\t\t\t}\n\t\t\ttype\n\t\t\tearliestDetectionAt    \n\t\t\t}\n\t}\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery SpeciesInfoById($speciesId: ID!){\n\t\tspecies(id: $speciesId) {\n\t\t\tid\n\t\t\talpha\n\t\t\tcommonName\n\t\t\tscientificName\n\t\t\tclassification \n\t\t}\n}\n"): (typeof documents)["\n\tquery SpeciesInfoById($speciesId: ID!){\n\t\tspecies(id: $speciesId) {\n\t\t\tid\n\t\t\talpha\n\t\t\tcommonName\n\t\t\tscientificName\n\t\t\tclassification \n\t\t}\n}\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;