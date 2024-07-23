import fs from "fs";

type BirdRecord = { bird: string; count: number };

type DayRecord = { date: string; dayData: BirdRecord[] | null };

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
): Promise<BirdRecord[] | null> {
  const queryUrl = `${haikuBaseUrl}haikubox/${serialNumber}/daily-count?date=${when}`;

  let birds: BirdRecord[] | null = null;
  try {
    birds = await (await fetch(queryUrl)).json();
  } catch (e) {
    console.log(e);
  }
  return birds;
}

/**
 * List all the dates for which we have data files, sorted
 *
 * @param dataDir
 */
function listDatesWithData(dataDir: string): string[] {
  const dirList = fs.readdirSync(dataDir);
  // console.log(JSON.stringify(dirList));
  const rawFiles = dirList.filter((f) => f.match(/^\d{4}-\d{2}-\d{2}/)).map((f) => f.split(".")[0]);
  rawFiles.sort();
  return rawFiles;
}

/**
 * Fetch and parse a given day's file
 *
 * @param dataDir
 */
function loadCachedDailyData(dataDir: string): DayRecord[] {
  const dates = listDatesWithData(dataDir);

  const allData: DayRecord[] = [];
  // console.log(JSON.stringify(dates));
  for (const date of dates) {
    const dayData = JSON.parse(fs.readFileSync(`${dataDir}/${date}.json`, "utf-8")) as
      | BirdRecord[]
      | null;
    allData.push({ date, dayData: dayData });
  }
  return allData;
}

/**
 * Given a set of daily records, convert to a list of BirdRecords covering the total time period, one count per bird
 *
 * @param allData
 * @param dailyMinimum
 * @param totalMinimum
 */
function aggregateAllDays(allData: DayRecord[], dailyMinimum = 1, totalMinimum = 1): BirdRecord[] {
  const totalCountMap: { [bird: string]: number } = {};
  allData.forEach((d) => {
    if (d.dayData) {
      d.dayData
        .filter((c) => c.count >= dailyMinimum)
        .map(
          (b) =>
            (totalCountMap[b.bird] = totalCountMap[b.bird]
              ? totalCountMap[b.bird] + b.count
              : b.count)
        );
    }
  });

  const totalCount: BirdRecord[] = [];
  for (const birdKey in totalCountMap) {
    totalCount.push({ bird: birdKey, count: totalCountMap[birdKey] });
  }

  // console.log(totalCountMap);

  totalCount.sort((a, b) => b.count - a.count);

  return totalCount.filter((d) => d.count >= totalMinimum);
}

export { fetchDailyCount, loadCachedDailyData, aggregateAllDays };
export type { DayRecord, BirdRecord };
