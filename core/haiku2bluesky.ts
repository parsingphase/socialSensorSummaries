import { buildTopBirdsPost } from "./buildPost";

/**
 * Build daily summary string
 *
 * @param birds
 * @param maxBirds
 * @param maxPostLength
 * @param minObservationCount
 * @param confirmedObservations
 */
function buildBirdPostForBluesky(
  birds: { bird: string; count: number }[],
  confirmedObservations?: string[],
  maxBirds = 10,
  minObservationCount = 1,
  maxPostLength = 300
): string {
  // const caveatUrl = "https://m.phase.org/@parsingphase/111711558681612429";
  const caveatUrl = null;
  return buildTopBirdsPost(
    birds,
    maxBirds,
    maxPostLength,
    minObservationCount,
    confirmedObservations,
    caveatUrl
  );
}

export { buildBirdPostForBluesky };
