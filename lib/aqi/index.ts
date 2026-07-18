import { rbgToHexColor } from "../utils";

// copied from awn-anon-data-api:lib/aqi

const UGM3 = "µg/m³";

enum AqiZoneDescriptors {
	GOOD = "Good",
	MODERATE = "Moderate",
	UNHEALTHY_FSG = "Unhealthy For Sensitive Groups",
	UNHEALTHY = "Unhealthy",
	VERY_UNHEALTHY = "Very Unhealthy",
	HAZARDOUS = "Hazardous",
}

enum AqiPollutants {
	Ozone = "Ozone", // 1h & 8h scales
	PM2_5 = "PM2.5", // 24h scale
	PM10 = "PM10", // 24h scale
	CarbonMonoxide = "CO", // 8h scale
	SulphurDioxide = "SO2", // 1h scale
	NitrogenDioxide = "NO2", // 1h scale
}

enum NonAqiAirConstituents {
	CO2 = "CO2",
}

type AqiZone = {
	concentration: {
		lowEnd: number;
		highEnd: number;
	};
	aqi: {
		lowEnd: number;
		highEnd: number;
	};
	descriptor: AqiZoneDescriptors;
	color: string;
};

type AqiPollutantSpec = {
	pollutant: AqiPollutants;
	unit: string;
	inputRoundingDecimalPlaces: number;
	zones: Omit<AqiZone, "color">[];
};

type AqiDescriptorColorMap = Record<AqiZoneDescriptors, string>;

type AqiPollutantSpecTable = Partial<Record<AqiPollutants, AqiPollutantSpec>>;

const aqiDescriptorColorMap: AqiDescriptorColorMap = {
	Good: rbgToHexColor(0, 228, 0),
	Moderate: rbgToHexColor(255, 255, 0),
	"Unhealthy For Sensitive Groups": rbgToHexColor(255, 126, 0),
	Unhealthy: rbgToHexColor(255, 0, 0),
	"Very Unhealthy": rbgToHexColor(143, 63, 151),
	Hazardous: rbgToHexColor(126, 0, 35),
};

// Scale from US EPA 2024-05, 24-hour averages
const aqiPollutantSpecTable: AqiPollutantSpecTable = {
	[AqiPollutants.PM2_5]: {
		pollutant: AqiPollutants.PM2_5,
		unit: UGM3,
		inputRoundingDecimalPlaces: 1,
		zones: [
			{
				concentration: { lowEnd: 0, highEnd: 9 },
				aqi: { lowEnd: 0, highEnd: 50 },
				descriptor: AqiZoneDescriptors.GOOD,
			},
			{
				concentration: { lowEnd: 9.1, highEnd: 35.4 },
				aqi: { lowEnd: 51, highEnd: 100 },
				descriptor: AqiZoneDescriptors.MODERATE,
			},
			{
				concentration: { lowEnd: 35.5, highEnd: 55.4 },
				aqi: { lowEnd: 101, highEnd: 150 },
				descriptor: AqiZoneDescriptors.UNHEALTHY_FSG,
			},
			{
				concentration: { lowEnd: 55.5, highEnd: 125.4 },
				aqi: { lowEnd: 151, highEnd: 200 },
				descriptor: AqiZoneDescriptors.UNHEALTHY,
			},
			{
				concentration: { lowEnd: 125.5, highEnd: 225.4 },
				aqi: { lowEnd: 201, highEnd: 300 },
				descriptor: AqiZoneDescriptors.VERY_UNHEALTHY,
			},
			{
				concentration: { lowEnd: 225.5, highEnd: 325.4 },
				aqi: { lowEnd: 301, highEnd: 500 },
				descriptor: AqiZoneDescriptors.HAZARDOUS,
			},
		],
	},
	[AqiPollutants.PM10]: {
		pollutant: AqiPollutants.PM10,
		unit: UGM3,
		inputRoundingDecimalPlaces: 0,
		zones: [
			{
				concentration: { lowEnd: 0, highEnd: 54 },
				aqi: { lowEnd: 0, highEnd: 50 },
				descriptor: AqiZoneDescriptors.GOOD,
			},
			{
				concentration: { lowEnd: 55, highEnd: 154 },
				aqi: { lowEnd: 51, highEnd: 100 },
				descriptor: AqiZoneDescriptors.MODERATE,
			},
			{
				concentration: { lowEnd: 155, highEnd: 254 },
				aqi: { lowEnd: 101, highEnd: 150 },
				descriptor: AqiZoneDescriptors.UNHEALTHY_FSG,
			},
			{
				concentration: { lowEnd: 255, highEnd: 354 },
				aqi: { lowEnd: 151, highEnd: 200 },
				descriptor: AqiZoneDescriptors.UNHEALTHY,
			},
			{
				concentration: { lowEnd: 355, highEnd: 424 },
				aqi: { lowEnd: 201, highEnd: 300 },
				descriptor: AqiZoneDescriptors.VERY_UNHEALTHY,
			},
			{
				concentration: { lowEnd: 425, highEnd: 604 },
				aqi: { lowEnd: 301, highEnd: 500 },
				descriptor: AqiZoneDescriptors.HAZARDOUS,
			},
		],
	},
};

// Copied from awn-anon-data-api:lambda/types.ts
type PollutantAqiSummary = {
	aqi: number;
	zone: { color: string; descriptor: string };
};

// Copied from awn-anon-data-api:lambda/lambda.ts

/*
FROM technical-assistance-document-for-the-reporting-of-daily-air-quailty.pdf:
For AQI values in the hazardous category, AQI values greater than 500 should be
calculated using equation 1 and the concentration specified for the AQI value of
500.
 */

function getAqiDataFromConcentration(
	rawValue: number | undefined,
	spec: AqiPollutantSpec,
): PollutantAqiSummary | null {
	if (rawValue === undefined) {
		return null;
	}
	const roundValue = +rawValue.toFixed(spec.inputRoundingDecimalPlaces);
	const zone = spec.zones.find(
		(s) =>
			roundValue >= s.concentration.lowEnd &&
			(s.concentration.highEnd === 500 || // per technical design doc
				roundValue <= s.concentration.highEnd),
	);
	if (zone) {
		const aqi = Math.round(
			((roundValue - zone.concentration.lowEnd) /
				(zone.concentration.highEnd - zone.concentration.lowEnd)) *
				(zone.aqi.highEnd - zone.aqi.lowEnd) +
				zone.aqi.lowEnd,
		);

		return {
			aqi,
			zone: {
				descriptor: zone.descriptor,
				color: aqiDescriptorColorMap[zone.descriptor],
			},
		};
	}
	return null;
}

export type { AqiZone, AqiPollutantSpec, PollutantAqiSummary };
export {
	aqiDescriptorColorMap,
	aqiPollutantSpecTable,
	getAqiDataFromConcentration,
	UGM3,
	AqiPollutants,
	NonAqiAirConstituents,
};
