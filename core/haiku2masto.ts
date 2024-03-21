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
  let tailText = "\n\n#Birds #BirdsongDetection";
  const optionalTag = " #HaikuBox";
  const candidateLines: string[] = [];
  let unverifiedBirds = 0;

  const normalizeBirdName = (n: string) => n.replace(/^[a-z]+/g, '').toLowerCase();
  const normalizedSeenBirds = (confirmedObservations || []).map(normalizeBirdName)

  function buildLine(index: number, bird: string): string {
    let line = `${index + 1} ${bird}`;
    if (!normalizedSeenBirds.includes(normalizeBirdName(bird))) {
      line += " ^";
      unverifiedBirds++;
    }
    return line;
  }

  birds
    .filter((b) => b.count >= minObservationCount)
    .slice(0, maxBirds)
    .forEach(({bird}, index) => candidateLines.push(buildLine(index, bird)));

  if (unverifiedBirds > 0) {
    tailText = `\n\n ^ caveat: ${caveatUrl}` + tailText;
  }

  for (let i = 0; i < candidateLines.length; i++) {
    if (
      postText.length + candidateLines[i].length + tailText.length <
      maxPostLength
    ) {
      postText += `\n${candidateLines[i]}`;
    } else {
      break;
    }
  }

  postText += tailText;

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
 */
async function postToMastodon(
  mastoBaseUrl: string,
  apiClientToken: string,
  postString: string,
  postVisibility: string
): Promise<Status> {
  const masto = await login({
    url: mastoBaseUrl,
    accessToken: apiClientToken,
  });
  console.log(`Logged in…`);

  const statusParams: CreateStatusParams = {
    status: postString,
    visibility: postVisibility as StatusVisibility,
  };
  return masto.statuses.create(statusParams);
}

export { buildBirdPost, postToMastodon };
