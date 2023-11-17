#!/usr/bin/env npx ts-node --esm -r tsconfig-paths/register

import * as fs from "fs";
import {
  aggregateAllDays,
  BirdRecord,
  DayRecord,
  loadCachedDailyData,
} from "./haiku";

const rawDir = `${__dirname}/rawHaikuData`;

/**
 * Run script
 */
async function main(): Promise<void> {
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
