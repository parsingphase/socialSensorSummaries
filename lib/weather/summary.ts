import SunCalc from "suncalc";
import { DateTime } from "luxon";
import { AmbientWeatherApiConfig, fetchDeviceWeatherRecords } from "./ambient";

async function buildDaylightWeatherSummaryForDay(
  ambientWeatherConfig: AmbientWeatherApiConfig,
  location: { latitude: number; longitude: number },
  day: Date
) {
  const { latitude, longitude } = location;
  const envTimes = SunCalc.getTimes(day, latitude, longitude);
  const { sunrise, sunset } = envTimes;

  const sunriseLuxon = DateTime.fromJSDate(sunrise);
  const sunsetLuxon = DateTime.fromJSDate(sunset);
  const sunsetEpochMs = sunsetLuxon.toUnixInteger() + "000";

  const daylightMinutes = sunsetLuxon.diff(sunriseLuxon).as("minutes");
  const intervals = Math.ceil(daylightMinutes / 5);
  const daylightHoursRaw = daylightMinutes / 60;
  const daylightHours = daylightHoursRaw.toFixed(1);

  const queryParams = {
    limit: intervals,
    endDate: sunsetEpochMs, //epochMs
  };
  const weatherData = await fetchDeviceWeatherRecords(ambientWeatherConfig, queryParams);

  const intervalsReceived = weatherData.length;

  const temperatures = weatherData.map((d) => d.tempf);
  const maxTemp = Math.max(...temperatures);
  const minTemp = Math.min(...temperatures);

  const peakGust = Math.max(...weatherData.map((d) => d.windgustmph)).toFixed(1);

  const rainByHour = weatherData.map((d) => d.hourlyrainin ?? 0);
  const sumOfHourlyRainMeasurements = rainByHour.reduce((a, c) => a + c, 0);
  const estPeriodRain = (sumOfHourlyRainMeasurements / intervalsReceived) * daylightHoursRaw;

  const dateString = DateTime.fromJSDate(day).toFormat("yyyy-MM-dd");

  const summary = `Daylight weather conditions for ${dateString} 🤖:
  ${daylightHours} hours daylight
  Temp ${minTemp}ºF - ${maxTemp}ºF
  Approx rainfall: ${estPeriodRain.toFixed(2)} inches
  Max wind: ${peakGust} mph
  `.replace(/\n +/g, "\n");

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
  return summary;
}

export { buildDaylightWeatherSummaryForDay };
