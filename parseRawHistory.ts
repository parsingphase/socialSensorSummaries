#!/usr/bin/env npx ts-node --esm -r tsconfig-paths/register

import * as fs from "fs";
import { BirdRecord, DayRecord, loadCachedDailyData } from "./haiku";

const rawDir = `${__dirname}/rawHaikuData`;

/**
 * Given a set of daily records, convert to a list of BirdRecords covering the total time period, one count per bird
 *
 * @param allData
 * @param dailyMinimum
 * @param totalMinimum
 */
function aggregateAllDays(
  allData: DayRecord[],
  dailyMinimum: number = 1,
  totalMinimum: number = 1
): BirdRecord[] {
  const totalCountMap: { [bird: string]: number } = {};
  allData.map((d) => {
    return d.dayData
      .filter((c) => c.count >= dailyMinimum)
      .map(
        (b) =>
          (totalCountMap[b.bird] = totalCountMap[b.bird]
            ? totalCountMap[b.bird] + b.count
            : b.count)
      );
  });

  const totalCount: BirdRecord[] = [];
  for (const birdKey in totalCountMap) {
    totalCount.push({ bird: birdKey, count: totalCountMap[birdKey] });
  }

  // console.log(totalCountMap);

  totalCount.sort((a, b) => b.count - a.count);

  return totalCount.filter((d) => d.count >= totalMinimum);
}

async function main() {
  const allData = loadCachedDailyData(rawDir);

  // just get all names
  // const initial: string[] = []
  // const allBirds  = Array.from(new Set(allData.reduce((all,day) => [...all,...day.dayData.map(b=>b.bird)], initial )));
  // console.log(JSON.stringify(allBirds, null, 2));
  // console.log(allBirds.length);

  const dailyMinimum = 3;
  const totalMinimum = 10;
  const aggregate = aggregateAllDays(allData, dailyMinimum, totalMinimum).slice(
    0,
    20
  );
  // console.log(aggregate, aggregate.length);

  const allDays = allData.map((a) => a.date);
  const topBirds = aggregate.map((d) => d.bird);
  const csvData: any[][] = [["", ...allDays]];
  for (const bird of topBirds) {
    // console.log({ bird });
    const row: any[] = [bird];
    for (const day of allDays) {
      // console.log({ day });
      const foundDay: DayRecord[] = allData.filter((ad) => ad.date == day);
      // console.log(foundDay);
      if (foundDay.length == 0) {
        row.push(0);
      } else {
        const foundRecord: BirdRecord[] = foundDay[0].dayData.filter(
          (d) => d.bird == bird
        );
        // console.log({bird,foundRecord});
        row.push(foundRecord.length > 0 ? foundRecord[0].count : 0);
      }
    }
    csvData.push(row);
  }

  // console.log(csvData);

  fs.writeFileSync("tmp/grid.csv", csvData.map((r) => r.join(",")).join("\n"));
}

main().finally(() => console.log("DONE"));
