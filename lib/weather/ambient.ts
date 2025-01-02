import { objectToQueryString } from "../utils";

/**
 * NB: this type is specific to my sensor setup
 *
 * See https://github.com/ambient-weather/api-docs/wiki/Device-Data-Specs for other options
 */
type AmbientWeatherInterval = {
  dateutc: number; // int, epochMs
  tempf: number; // float
  humidity: number; // int
  windspeedmph: number; // float
  windgustmph: number; // float
  maxdailygust: number; // float
  winddir: number; // int
  winddir_avg10m: number; // int
  uv: number; // int
  solarradiation: number; // float

  hourlyrainin: number; // float
  eventrainin: number; // float
  dailyrainin: number; // float
  weeklyrainin: number; // float
  monthlyrainin: number; // float
  yearlyrainin: number; // float
  totalrainin: number; // float

  tempinf: number; // float
  humidityin: number; // int
  baromrelin: number; // float
  baromabsin: number; // float
  battin: number; // int
  feelsLike: number; // float
  dewPoint: number; // float
  feelsLikein: number; // float
  dewPointin: number; // int

  lastRain: string; // ISO format "2025-01-01T12:40:00.000Z",
  date: string; // ISO format
};

type AmbientWeatherApiConfig = {
  apiBaseUrl: string;
  apiKey: string;
  applicationKey: string;
  deviceMac: string;
};

type AmbientWeatherApiDeviceQueryParams = {
  // Number of intervals to return. Interval is determined by API / user account level? (5 or 30 mins)
  // Default 228 (24 hrs of 5 minutes)
  limit?: number;
  // Date as milliseconds since epoch
  endDate?: string;
};

async function fetchDeviceWeatherRecords(
  ambientWeatherConfig: AmbientWeatherApiConfig,
  queryParams: AmbientWeatherApiDeviceQueryParams
) {
  const { apiBaseUrl, apiKey, applicationKey, deviceMac } = ambientWeatherConfig;
  const endpoint = "/v1/devices/";
  const queryUrl = `${apiBaseUrl}${endpoint}${deviceMac}?${objectToQueryString({
    ...queryParams,
    apiKey,
    applicationKey,
  })}`;
  const weatherData: AmbientWeatherInterval[] = await (await fetch(queryUrl)).json();
  return weatherData;
}

export { fetchDeviceWeatherRecords };
export type { AmbientWeatherInterval, AmbientWeatherApiConfig, AmbientWeatherApiDeviceQueryParams };
