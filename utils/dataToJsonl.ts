#!/usr/bin/env npx tsx
import fs from "fs";

export {};

type DayRecord = { date: string } & Record<string, number>;

/**
 * Load an array of DayRecords from daily json files in dir
 * @param dataDir
 */
function loadDayRecordsFromDataDir(dataDir: string): DayRecord[] {
  const files = fs.readdirSync(dataDir);
  // console.log(files);
  const allDays = files.map((f) => {
    const fileData = fs.readFileSync(`${dataDir}/${f}`, { encoding: "utf-8" });
    const parsedData = JSON.parse(fileData);
    const dateString = f.replace(".json", "");
    // console.log({ date: dateString, birds: parsedData });
    const mapper = (acc: DayRecord, bird: { bird: string; count: number }): DayRecord => ({
      ...acc,
      [bird.bird]: bird.count,
    });

    const dayRecord: DayRecord = parsedData?.reduce(mapper, { date: dateString });

    return dayRecord;
  });
  return allDays;
}

/**
 * Read all daily files and emit as jsonl
 */
function main(): void {
  const dataDir = `${__dirname}/../rawHaikuData`;
  const allDays = loadDayRecordsFromDataDir(dataDir);

  allDays.forEach((d) => console.log(JSON.stringify(d)));
}

main();
