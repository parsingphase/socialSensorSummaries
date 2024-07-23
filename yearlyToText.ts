#!/usr/bin/env npx ts-node --esm -r tsconfig-paths/register

import { config } from "./config/config";

async function main() {
  const { serialNumber, apiBaseUrl: haikuBaseUrl } = config.haikubox;

  const queryUrl = `${haikuBaseUrl}haikubox/${serialNumber}/yearly-count?year=2023`;

  const birds: { bird: string; count: number }[] = await (await fetch(queryUrl)).json();

  for (let i = 0; i < birds.length; i++) {
    console.log(`${i + 1} ${birds[i].bird}`);
  }
}

main().finally(() => null);
