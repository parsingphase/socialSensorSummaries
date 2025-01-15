import SunCalc from "suncalc";
import { DateTime } from "luxon";
import { AmbientWeatherApiConfig, AmbientWeatherInterval, fetchDeviceWeatherRecords, } from "./ambient";

function analyzeWeatherData(weatherData: AmbientWeatherInterval[]) {
  const intervalsReceived = weatherData.length;

  const timesEpochMs = weatherData.map((d) => d.dateutc);
  const maxTime = Math.max(...timesEpochMs);
  const minTime = Math.min(...timesEpochMs);
  const duration = DateTime.fromMillis(maxTime).diff(DateTime.fromMillis(minTime)).as("hours");

  const temperatures = weatherData.map((d) => d.tempf);
  const maxTemp = Math.max(...temperatures);
  const minTemp = Math.min(...temperatures);

  const peakGust = Math.max(...weatherData.map((d) => d.windgustmph)).toFixed(1);

  const rainByHour = weatherData.map((d) => d.hourlyrainin ?? 0);
  const sumOfHourlyRainMeasurements = rainByHour.reduce((a, c) => a + c, 0);
  const estPeriodRain = ((sumOfHourlyRainMeasurements / intervalsReceived) * duration).toFixed(2);
  return { maxTemp, minTemp, peakGust, estPeriodRain };
}

async function buildWeatherSummaryForDay(
  ambientWeatherConfig: AmbientWeatherApiConfig,
  location: { latitude: number; longitude: number },
  day: Date
) {
  const { latitude, longitude } = location;
  const envTimes = SunCalc.getTimes(day, latitude, longitude);
  const { sunrise, sunset } = envTimes;

  const sunriseLuxon = DateTime.fromJSDate(sunrise);
  const sunsetLuxon = DateTime.fromJSDate(sunset);
  // const sunsetEpochMs = sunsetLuxon.toUnixInteger() + "000";
  const startOfDay = DateTime.now().setZone('US/Eastern').startOf("day");
  const midnightMs = startOfDay.toUnixInteger() + "000";
  console.log({ startOfDay });

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

  return `Weather conditions for ${dateString} 🤖:
  
  Sunrise - sunset (${daylightHours} hours):
  Temp ${daylightSummary.minTemp}ºF - ${daylightSummary.maxTemp}ºF
  Approx rainfall: ${daylightSummary.estPeriodRain} inches
  Max wind: ${daylightSummary.peakGust} mph
  
  24 hours:
  Temp ${wholeDaySummary.minTemp}ºF - ${wholeDaySummary.maxTemp}ºF
  Approx rainfall: ${wholeDaySummary.estPeriodRain} inches
  Max wind: ${wholeDaySummary.peakGust} mph
  `.replace(/\n +/g, "\n");
}

export { buildWeatherSummaryForDay };
