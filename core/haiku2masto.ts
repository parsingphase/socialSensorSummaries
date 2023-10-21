import { CreateStatusParams, login, Status, StatusVisibility } from "masto";

/**
 * Fetch daily status from Haikubox API
 * @param haikuBaseUrl
 * @param serialNumber
 * @param when
 */
async function fetchDailyCount(
  haikuBaseUrl: string,
  serialNumber: string,
  when: string
): Promise<{ bird: string; count: number }[]> {
  const queryUrl = `${haikuBaseUrl}haikubox/${serialNumber}/daily-count?date=${when}`;

  const birds: { bird: string; count: number }[] = await (
    await fetch(queryUrl)
  ).json();

  if (!(birds && birds?.length > 0)) {
    throw new Error("No birds!");
  }
  return birds;
}

/**
 * Build daily summary string
 *
 * @param birds
 * @param maxBirds
 * @param maxPostLength
 * @param minObservationCount
 */
function buildBirdPost(
  birds: { bird: string; count: number }[],
  maxBirds: number,
  maxPostLength: number = 500,
  minObservationCount?: number
): string {
  // sorted by default, but let's be sure
  birds.sort((a, b) => b.count - a.count);

  let postText = "#YesterdaysYardBirds (NE MA):\n";
  const tailText = "\n\n#DailyBird #Birds";
  const candidateLines: string[] = [];

  (minObservationCount
    ? birds.filter((b) => b.count >= minObservationCount)
    : birds
  )
    .slice(0, maxBirds)
    .forEach(({ bird }, index) => candidateLines.push(`${index + 1}: ${bird}`));

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

export { buildBirdPost, postToMastodon, fetchDailyCount };
