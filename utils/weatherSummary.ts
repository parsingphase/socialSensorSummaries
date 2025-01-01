#!/usr/bin/env npx tsx -r tsconfig-paths/register

import SunCalc from "suncalc";
import { DateTime } from "luxon";
import { config } from "../config/config";
import { fetchRecentWeatherRecords } from "../lib/ambientWeather";

async function main(): Promise<void> {
  const yesterday = DateTime.now().minus({ days: 0 }).toJSDate();
  const location = config.location;

  const { latitude, longitude } = location;
  const envTimes = SunCalc.getTimes(yesterday, latitude, longitude);
  const { sunrise, sunset } = envTimes;

  const sunriseLuxon = DateTime.fromJSDate(sunrise);
  const sunsetLuxon = DateTime.fromJSDate(sunset);
  const sunsetEpochMs = sunsetLuxon.toUnixInteger() + "000";

  const daylightMinutes = sunsetLuxon.diff(sunriseLuxon).as("minutes");
  const intervals = Math.ceil(daylightMinutes / 5);
  const daylightHoursRaw = daylightMinutes / 60;
  const daylightHours = daylightHoursRaw.toFixed(1);

  const ambientWeatherConfig = config.ambientWeather;

  const queryParams = {
    limit: intervals,
    endDate: sunsetEpochMs, //epochMs
  };
  const weatherData = await fetchRecentWeatherRecords(ambientWeatherConfig, queryParams);

  const intervalsReceived = weatherData.length;

  const temperatures = weatherData.map((d) => d.tempf);
  const maxTemp = Math.max(...temperatures);
  const minTemp = Math.min(...temperatures);

  const peakGust = Math.max(...weatherData.map((d) => d.windgustmph)).toFixed(1);

  const rainByHour = weatherData.map((d) => d.hourlyrainin ?? 0);
  const sumOfHourlyRainMeasurements = rainByHour.reduce((a, c) => a + c, 0);
  const estPeriodRain = (sumOfHourlyRainMeasurements / intervalsReceived) * daylightHoursRaw;

  console.log({
    intervalsReceived,
    sunrise,
    sunset,
    daylightHours,
    maxTemp,
    minTemp,
    estPeriodRain,
    peakGust,
  });

  const summary = `Daylight weather conditions:
  ${daylightHours} hours daylight
  Temp ${minTemp}ºF - ${maxTemp}ºF
  Approx rainfall: ${estPeriodRain.toFixed(2)} inches
  Max wind: ${peakGust} mph
  `.replace(/\n +/g, "\n");

  console.log(summary);
  console.log(summary.length);
}

main()
  .catch((e) => console.error(e))
  .finally(() => console.error("Done"));
