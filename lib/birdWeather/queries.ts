import { gql } from "graphql-tag";

// If you change this file, re-run `npm run generate:graphql:client`

const dailyDetectionsQuery = gql`
  query DailyDetections($stationId: ID!, $days: Int!) {
    dailyDetectionCounts(stationIds: [$stationId], period: { count: $days, unit: "day" }) {
      date
      dayOfYear
      counts {
        count
        species {
          alpha
          commonName
        }
      }
    }
  }
`;

// eg period: { from: "2025-12-26", to: "2025-12-26" }
const allDetectionsInPeriodQuery = gql`
  query AllDetectionsInPeriod(
    $stationId: ID!
    $from: ISO8601Date!
    $to: ISO8601Date!
    $after: String
  ) {
    detections(stationIds: [$stationId], period: { from: $from, to: $to }, after: $after) {
      pageInfo {
        startCursor
        endCursor
        hasNextPage
        hasPreviousPage
      }
      edges {
        cursor
        node {
          timestamp
          species {
            commonName
          }
          confidence
          probability
          score
        }
      }
    }
  }
`;

const bucketObservationsQuery = gql`
query BucketSpeciesObservations($speciesId: ID!, $stationId: ID!, $fromDate: ISO8601Date!, $toDate: ISO8601Date!, $bucketMinutes: Int!) {
  species(id: $speciesId) {
    commonName
    id
    # period is *inclusive* days
    detectionCounts(period:{from: $fromDate, to: $toDate}, group: $bucketMinutes, stationIds:[$stationId]) {
      count
      bins {
           key
           count
         }
      }
   }
}`;

const stationInfoQuery = gql`
	query StationInfo($stationId: ID!) {
		station(id: $stationId) {
			id
			name
			state
			country
			continent
			location
			locationPrivacy
			coords { 
			 lat, 
			 lon
			}
			type
			earliestDetectionAt    
			}
	}
`;

export {
	allDetectionsInPeriodQuery,
	dailyDetectionsQuery,
	bucketObservationsQuery,
	stationInfoQuery,
};
