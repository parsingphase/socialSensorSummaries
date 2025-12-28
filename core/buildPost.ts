/**
 * Build the list of most-seen birds into a post
 *
 * @param birds
 * @param maxBirds
 * @param maxPostLength
 * @param minObservationCount
 * @param confirmedObservations
 * @param caveatText
 * @param sourceTag
 * @param topXnote
 */
function buildTopBirdsPost(
  birds: { bird: string; count: number }[],
  maxBirds: number,
  maxPostLength: number,
  minObservationCount: number,
  confirmedObservations: string[] | undefined,
  caveatText: string | null,
  sourceTag?: string,
  topXnote = false
): string {
  // sorted by default, but let's be sure
  birds.sort((a, b) => b.count - a.count);

  const topNoteString = topXnote ? ` top ${maxBirds}` : "";
  let postText = `#YesterdaysYardBirds${topNoteString} 🤖 (NE MA):\n`;
  const fixedTags = "\n\n#Birds #BirdsongDetection";
  let unverifiedBirds = 0;
  let firstUnverifiedBirdIndex: number | null = null;
  let caveatAppendedText = "";

  const optionalTag = sourceTag ? ` ${sourceTag}` : null;
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
    if (caveatText && !normalizedSeenBirds.includes(normalizeBirdName(bird))) {
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

  if (unverifiedBirds > 0 && caveatText) {
    caveatAppendedText = caveatText;
  }

  let maxBirdIndexIncluded = 0;
  for (let i = 0; i < candidateLines.length; i++) {
    if (
      postText.length + candidateLines[i].length + fixedTags.length + caveatAppendedText.length <
      maxPostLength
    ) {
      postText += `\n${candidateLines[i]}`;
      maxBirdIndexIncluded = i;
    } else {
      break;
    }
  }

  if (firstUnverifiedBirdIndex !== null && maxBirdIndexIncluded >= firstUnverifiedBirdIndex) {
    postText += caveatAppendedText;
  }

  postText += fixedTags;

  if ((postText + optionalTag).length <= maxPostLength) {
    postText += optionalTag;
  }

  return postText;
}

export { buildTopBirdsPost };
