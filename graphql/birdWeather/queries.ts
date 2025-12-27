import { gql } from "graphql-tag";

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

export { dailyDetectionsQuery };
