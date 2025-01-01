import { CreateStatusParams, login, Status, StatusVisibility } from "masto";

const caveatUrl = "https://m.phase.org/@parsingphase/111711558681612429";

/**
 * Build daily summary string
 *
 * @param birds
 * @param maxBirds
 * @param maxPostLength
 * @param minObservationCount
 * @param confirmedObservations
 */
function buildBirdPost(
  birds: { bird: string; count: number }[],
  maxBirds: number,
  maxPostLength = 500,
  minObservationCount = 1,
  confirmedObservations?: string[]
): string {
  // sorted by default, but let's be sure
  birds.sort((a, b) => b.count - a.count);

  let postText = "#YesterdaysYardBirds 🤖 (NE MA):\n";
  const fixedTags = "\n\n#Birds #BirdsongDetection";
  let unverifiedBirds = 0;
  let firstUnverifiedBirdIndex: number | null = null;
  let caveat = "";

  const optionalTag = " #HaikuBox";
  const candidateLines: string[] = [];
  const normalizeBirdName = (n: string) => n.replace(/^[a-z]+/g, "").toLowerCase();
  const normalizedSeenBirds = (confirmedObservations || []).map(normalizeBirdName);

  function buildLine(index: number, bird: string): string {
    let line = `${index + 1} ${bird}`;
    if (!normalizedSeenBirds.includes(normalizeBirdName(bird))) {
      line += " ^";
      unverifiedBirds++;
      if (!firstUnverifiedBirdIndex) {
        firstUnverifiedBirdIndex = index;
      }
    }
    return line;
  }

  birds
    .filter((b) => b.count >= minObservationCount)
    .slice(0, maxBirds)
    .forEach(({ bird }, index) => candidateLines.push(buildLine(index, bird)));

  if (unverifiedBirds > 0) {
    caveat = `\n\n ^ caveat: ${caveatUrl}`;
  }

  let maxBirdIndexIncluded = 0;
  for (let i = 0; i < candidateLines.length; i++) {
    if (
      postText.length + candidateLines[i].length + fixedTags.length + caveat.length <
      maxPostLength
    ) {
      postText += `\n${candidateLines[i]}`;
      maxBirdIndexIncluded = i;
    } else {
      break;
    }
  }

  if (firstUnverifiedBirdIndex !== null && maxBirdIndexIncluded >= firstUnverifiedBirdIndex) {
    postText += caveat;
  }

  postText += fixedTags;

  if ((postText + optionalTag).length <= maxPostLength) {
    postText += optionalTag;
  }

  return postText;
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

export { buildBirdPost, postToMastodon };
