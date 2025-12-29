#!/usr/bin/env npx tsx

import { config as cliConfig } from "./config/config";
import { executeWithConfig, type LambdaConfig } from "./lambdaMasto";

/**
 * CLI main loop
 */
async function main(): Promise<void> {
	const { ambientWeather, mastodon, haikubox, location } = cliConfig;
	const builtConfig: LambdaConfig = {
		AWNApiKey: ambientWeather.apiKey,
		AWNApplicationKey: ambientWeather.applicationKey,
		AWNBaseUrl: ambientWeather.apiBaseUrl,
		AWNDeviceMac: ambientWeather.deviceMac,
		// birdWeatherBaseUrl: birdWeather.apiBaseUrl,
		// birdWeatherStationId: birdWeather.stationId,
		haikuBaseUrl: haikubox.apiBaseUrl,
		haikuSerialNumber: haikubox.serialNumber,
		latitude: location.latitude,
		longitude: location.longitude,
		mastoBaseUrl: mastodon.apiBaseUrl,
		mastoToken: mastodon.apiClientToken,
		visibility: "direct",
	};

	return executeWithConfig(builtConfig);
}

main().finally(() => console.log("DONE"));
