/**
 * Build the list of most-seen birds into a post
 *
 * @param birds
 * @param maxBirds
 * @param maxPostLength
 * @param minObservationCount
 * @param confirmedObservations
 * @param caveatUrl
 */
function buildTopBirdsPost(
  birds: { bird: string; count: number }[],
  maxBirds: number,
  maxPostLength: number,
  minObservationCount: number,
  confirmedObservations: string[] | undefined,
  caveatUrl: string | null
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
  const normalizeBirdName = (n: string): string => n.replace(/^[a-z]+/g, "").toLowerCase();
  const normalizedSeenBirds = (confirmedObservations || []).map(normalizeBirdName);

  /**
   * Build single count row
   * @param index
   * @param bird
   */
  function buildLine(index: number, bird: string): string {
    let line = `${index + 1} ${bird}`;
    if (caveatUrl && !normalizedSeenBirds.includes(normalizeBirdName(bird))) {
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

  if (unverifiedBirds > 0 && caveatUrl) {
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

export { buildTopBirdsPost };
