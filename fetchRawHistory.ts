#!/usr/bin/env npx ts-node --esm -r tsconfig-paths/register

import { DateTime } from "luxon";
import { config } from "./config/config";
import { fetchDailyCount } from "./haiku";
import * as fs from "fs";

const start = DateTime.local(2023, 7, 15);
const outDir = `${__dirname}/rawHaikuData`;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const { serialNumber, apiBaseUrl: haikuBaseUrl } = config.haikubox;

  let day: DateTime = start;
  do {
    const when = day.toFormat("yyyy-MM-dd");
    console.log(when);
    const file = outDir + `/${when}.json`;
    if (!fs.existsSync(file)) {
      const dayData = await fetchDailyCount(haikuBaseUrl, serialNumber, when);
      fs.writeFileSync(file, JSON.stringify(dayData, null, 2));
      await sleep(5000);
    }

    day = day.plus({ day: 1 });
  } while (day < DateTime.now());
}

main().finally(() => console.log("DONE"));
