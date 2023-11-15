import fs from "fs";

type BirdRecord = { bird: string; count: number };

type DayRecord = { date: string; dayData: BirdRecord[] };

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

  return birds || [];
}

function listDatesWithData(dataDir: string) {
  const dirList = fs.readdirSync(dataDir);
  // console.log(JSON.stringify(dirList));
  const rawFiles = dirList
    .filter((f) => f.match(/^\d{4}-\d{2}-\d{2}/))
    .map((f) => f.split(".")[0]);
  rawFiles.sort();
  return rawFiles;
}

function loadCachedDailyData(dataDir: string): DayRecord[] {
  const dates = listDatesWithData(dataDir);

  const allData: DayRecord[] = [];
  // console.log(JSON.stringify(dates));
  for (const date of dates) {
    const dayData = JSON.parse(
      fs.readFileSync(`${dataDir}/${date}.json`, "utf-8")
    ) as BirdRecord[];
    allData.push({ date, dayData });
  }
  return allData;
}

export { fetchDailyCount, loadCachedDailyData };
export type { DayRecord, BirdRecord };
