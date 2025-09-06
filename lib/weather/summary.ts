import SunCalc from "suncalc";
import { DateTime } from "luxon";
import {
  AmbientWeatherApiConfig,
  AmbientWeatherInterval,
  fetchDeviceWeatherRecords,
} from "./ambient";

type IntervalSummary = {
  maxTemp: number;
  minTemp: number;
  peakGust: number;
  estPeriodRain: number;
  lightningCount: number;
};

/**
 * Collect key data from a set of intervals
 * @param weatherData
 */
function analyzeWeatherData(weatherData: AmbientWeatherInterval[]): IntervalSummary {
  const intervalsReceived = weatherData.length;

  const timesEpochMs = weatherData.map((d) => d.dateutc);
  const maxTime = Math.max(...timesEpochMs);
  const minTime = Math.min(...timesEpochMs);
  const duration = DateTime.fromMillis(maxTime).diff(DateTime.fromMillis(minTime)).as("hours");

  // If not all sensors are responding for a given time period, fields can be missing / undefined. Filter these out.
  const temperatures = weatherData.map((d) => d.tempf).filter((d) => Number.isFinite(d));
  const maxTemp = Math.max(...temperatures);
  const minTemp = Math.min(...temperatures);

  const windGusts = weatherData.map((d) => d.windgustmph).filter((d) => Number.isFinite(d));
  const peakGust = parseFloat(Math.max(...windGusts).toFixed(1));

  const rainByHour = weatherData.map((d) => d.hourlyrainin ?? 0);
  const sumOfHourlyRainMeasurements = rainByHour.reduce((a, c) => a + c, 0);
  const estPeriodRain = parseFloat(
    ((sumOfHourlyRainMeasurements / intervalsReceived) * duration).toFixed(2)
  );

  const lightningCount = Math.max(...weatherData.map((d) => d.lightning_day));

  return { maxTemp, minTemp, peakGust, estPeriodRain, lightningCount };
}

/**
 * Build summary post for a given day
 *
 * @param ambientWeatherConfig
 * @param location
 * @param location.latitude
 * @param location.longitude
 * @param day
 */
async function buildWeatherSummaryForDay(
  ambientWeatherConfig: AmbientWeatherApiConfig,
  location: { latitude: number; longitude: number },
  day: Date
): Promise<string> {
  const { latitude, longitude } = location;
  const envTimes = SunCalc.getTimes(day, latitude, longitude);
  const { sunrise, sunset } = envTimes;

  const sunriseLuxon = DateTime.fromJSDate(sunrise);
  const sunsetLuxon = DateTime.fromJSDate(sunset);
  // const sunsetEpochMs = sunsetLuxon.toUnixInteger() + "000";
  const startOfNextDay = DateTime.fromJSDate(day)
    .plus({ day: 1 })
    .setZone("US/Eastern")
    .startOf("day");
  const midnightMs = startOfNextDay.toUnixInteger() + "000";

  const daylightMinutes = sunsetLuxon.diff(sunriseLuxon).as("minutes");
  // const intervals = Math.ceil(daylightMinutes / 5);
  const intervals = 24 * (60 / 5);

  const daylightHoursRaw = daylightMinutes / 60;
  const daylightHours = daylightHoursRaw.toFixed(1);

  const queryParams = {
    limit: intervals,
    endDate: midnightMs, //epochMs
  };
  const weatherData = await fetchDeviceWeatherRecords(ambientWeatherConfig, queryParams);

  const wholeDaySummary = analyzeWeatherData(weatherData);

  const sunlightHoursData = weatherData.filter(
    (d) => d.dateutc >= sunrise.valueOf() && d.dateutc <= sunset.valueOf()
  );
  const daylightSummary = analyzeWeatherData(sunlightHoursData);

  const dateString = DateTime.fromJSDate(day).toFormat("yyyy-MM-dd");

  const moonPhase = SunCalc.getMoonIllumination(day).phase;
  console.log({ moonPhase });
  const lunarIcon = String.fromCodePoint(Math.round(8 * moonPhase) + 0x1f311);

  const description = `Weather conditions for ${dateString} 🤖:
  
  Sunrise - sunset (${daylightHours} hours):
  Temp ${daylightSummary.minTemp}ºF - ${daylightSummary.maxTemp}ºF
  Approx rainfall: ${daylightSummary.estPeriodRain} inch${
    daylightSummary.estPeriodRain == 1 ? "" : "es"
  }
  Max wind: ${daylightSummary.peakGust} mph
  ${daylightSummary.lightningCount ? `Lightning: ${daylightSummary.lightningCount} strikes\n` : ""}
  24 hours ${lunarIcon}:
  Temp ${wholeDaySummary.minTemp}ºF - ${wholeDaySummary.maxTemp}ºF
  Approx rainfall: ${wholeDaySummary.estPeriodRain} inch${
    wholeDaySummary.estPeriodRain == 1 ? "" : "es"
  }
  Max wind: ${wholeDaySummary.peakGust} mph
  ${wholeDaySummary.lightningCount ? `Lightning: ${daylightSummary.lightningCount} strikes` : ""}
  `.replace(/\n +/g, "\n");
  console.log({ description, length: description.length });
  return description;
}

export { buildWeatherSummaryForDay };
