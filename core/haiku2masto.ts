import { CreateStatusParams, login, Status, StatusVisibility } from "masto";
import { buildTopBirdsPost } from "./buildPost";

/**
 * Build daily summary string
 *
 * @param birds
 * @param confirmedObservations
 * @param maxBirds
 * @param minObservationCount
 * @param maxPostLength
 */
function buildBirdPostForMastodon(
  birds: { bird: string; count: number }[],
  confirmedObservations?: string[],
  maxBirds = 20,
  minObservationCount = 10,
  maxPostLength = 500
): string {
  const caveatUrl = "https://m.phase.org/@parsingphase/111711558681612429";
  const caveatText = `\n\n ^ caveat: ${caveatUrl}`;

  return buildTopBirdsPost(
    birds,
    maxBirds,
    maxPostLength,
    minObservationCount,
    confirmedObservations,
    caveatText
  );
}

/**
 * Post plain string to mastodon
 *
 * @param mastoBaseUrl
 * @param apiClientToken
 * @param postString
 * @param postVisibility
 * @param inReplyToId
 */
async function postToMastodon(
  mastoBaseUrl: string,
  apiClientToken: string,
  postString: string,
  postVisibility: string,
  inReplyToId?: string
): Promise<Status> {
  const masto = await login({
    url: mastoBaseUrl,
    accessToken: apiClientToken,
  });
  console.log(`Logged in…`);

  const statusParams: CreateStatusParams = {
    status: postString,
    visibility: postVisibility as StatusVisibility,
    ...(inReplyToId ? { inReplyToId } : {}),
  };
  return masto.statuses.create(statusParams);
}

export { buildBirdPostForMastodon, postToMastodon };
