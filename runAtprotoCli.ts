#!/usr/bin/env npx tsx

import { config as cliConfig } from "./config/config";
import { executeWithConfig, type LambdaConfig } from "./lambdaAtproto";

/**
 * CLI main loop
 */
async function main(): Promise<void> {
	const { ambientWeather, birdWeather, blueSky, haikubox, location } =
		cliConfig;
	const builtConfig: LambdaConfig = {
		AWNApiKey: ambientWeather.apiKey,
		AWNApplicationKey: ambientWeather.applicationKey,
		AWNBaseUrl: ambientWeather.apiBaseUrl,
		AWNDeviceMac: ambientWeather.deviceMac,
		birdWeatherBaseUrl: birdWeather.apiBaseUrl,
		birdWeatherStationId: birdWeather.stationId,
		blueskyPassword: blueSky.password,
		blueskyServerBaseUrl: blueSky.serviceUrl,
		blueskyUsername: blueSky.username,
		haikuBaseUrl: haikubox.apiBaseUrl,
		haikuSerialNumber: haikubox.serialNumber,
		latitude: location.latitude,
		longitude: location.longitude,
	};

	return executeWithConfig(builtConfig);
}

main().finally(() => console.log("DONE"));
