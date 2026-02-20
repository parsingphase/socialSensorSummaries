import path from "node:path";
import { PROJECT_DIR } from "../../lib/utils";

/**
 * Get the root dir for the speciesBucketCache
 */
function getSpeciesBucketCacheRootDir(): string {
	return path.join(PROJECT_DIR, "rawBirdWeatherData", "speciesBucketCache");
}

function getSpeciesBucketCacheDirForSpeciesStationDuration(
	speciesId: number,
	stationId: number,
	minutes: number,
) {
	const cacheRootDir = getSpeciesBucketCacheRootDir();
	return `${cacheRootDir}/station-${stationId}/species-${speciesId}/duration-${minutes}min`;
}

/**
 * Get the root dir for the speciesObservationCache
 */
function getSpeciesObservationCacheRootDir(): string {
	return path.join(
		PROJECT_DIR,
		"rawBirdWeatherData",
		"speciesObservationCache",
	);
}

/**
 * Get the root dir for the speciesObservationCache
 */
function getAmbientWeatherCacheRootDir(): string {
	return path.join(PROJECT_DIR, "rawAmbientWeatherData", "dailyWeatherCache");
}

function getSpeciesObservationCacheDirForSpeciesStation(
	speciesId: number,
	stationId: number,
) {
	const cacheRootDir = getSpeciesObservationCacheRootDir();
	return `${cacheRootDir}/station-${stationId}/species-${speciesId}`;
}

function getAmbientWeatherCacheDirForStation(macAddress: string) {
	const stationId = macAddress.replaceAll(":", "");
	const cacheRootDir = getAmbientWeatherCacheRootDir();
	return `${cacheRootDir}/station-${stationId}`;
}

export {
	getAmbientWeatherCacheDirForStation,
	getSpeciesBucketCacheRootDir,
	getSpeciesBucketCacheDirForSpeciesStationDuration,
	getSpeciesObservationCacheRootDir,
	getSpeciesObservationCacheDirForSpeciesStation,
};
