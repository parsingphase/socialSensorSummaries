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
 * @param listLength
 */
function buildBirdPost(
  birds: { bird: string; count: number }[],
  listLength: number
): string {
  // sorted by default, but let's be sure
  birds.sort((a, b) => b.count - a.count);

  let postString = `The ${listLength} most frequently observed bird species in my yard yesterday:\n\n`;
  birds
    .slice(0, listLength)
    .forEach(({ bird }, index) => (postString += `${index + 1}: ${bird}\n`));

  postString += "\n#Birds #DailyBird";
  return postString;
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
