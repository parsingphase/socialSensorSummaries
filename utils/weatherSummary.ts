#!/usr/bin/env npx tsx -r tsconfig-paths/register

import SunCalc from "suncalc";
import { DateTime } from "luxon";
import { config } from "../config/config";

const endpoint = "/v1/devices/";

function objectToQueryString(obj: { [key: string]: number | string | undefined }): string {
  return Object.keys(obj)
    .filter((key) => typeof obj[key] !== "undefined")
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key]!)}`)
    .join("&");
}

async function main(): Promise<void> {
  const yesterday = DateTime.now().minus({ days: 1 }).toJSDate();
  const { latitude, longitude } = config.location;
  const { apiBaseUrl, apiKey, applicationKey, deviceMac } = config.ambientWeather;
  const envTimes = SunCalc.getTimes(yesterday, latitude, longitude);
  const { sunrise, sunset } = envTimes;

  const sunriseLuxon = DateTime.fromJSDate(sunrise);
  const sunsetLuxon = DateTime.fromJSDate(sunset);
  const sunsetEpochMs = sunsetLuxon.toUnixInteger() + "000";

  const daylightMinutes = sunsetLuxon.diff(sunriseLuxon, "minutes").as("minutes");
  const intervals = Math.ceil(daylightMinutes / 5);
  const daylightHours = Math.round(daylightMinutes / 6) / 10;

  const queryParams = {
    apiKey,
    applicationKey,
    limit: intervals,
    // Number of intervals to return. Interval is determined by API / user account level? (5 or 30 mins)
    // Default 228 (24 hrs of 5 minutes)
    endDate: sunsetEpochMs, //epochMs
  };

  const queryUrl = `${apiBaseUrl}${endpoint}${deviceMac}?${objectToQueryString(queryParams)}`;
  const weatherData = await (await fetch(queryUrl)).json();

  const temperatures = weatherData.map(d => d.tempf);
  const maxTemp = Math.max(...temperatures);
  const minTemp = Math.min(...temperatures);

  console.log({ sunrise, sunset, daylightHours, maxTemp, minTemp });
}

main()
  .catch((e) => console.error(e))
  .finally(() => console.log("Done"));
