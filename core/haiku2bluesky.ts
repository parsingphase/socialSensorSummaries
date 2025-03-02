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
  const caveatText = `\n\n ^ See caveat`;

  return buildTopBirdsPost(
    birds,
    maxBirds,
    maxPostLength,
    minObservationCount,
    confirmedObservations,
    caveatText
  );
}

export { buildBirdPostForBluesky };
