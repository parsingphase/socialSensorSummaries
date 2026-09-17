#!/usr/bin/env npx tsx

// Draws multi-year line chart from cached Haikubox data (use fetchRawHaikuboxHistory.ts)
// USAGE: ./utils/drawAllTimeSpeciesChart.ts "Ruby-throated Hummingbird"

import { type DatedCount, LineChart } from "../lib/charts/lineChart";
import {
	aggregateAllDays,
	type BirdRecord,
	type DayRecord,
	loadCachedDailyData,
} from "../lib/haiku";

const rawDir = `${__dirname}/../rawHaikuData`;

/**
 * Draw graph for a single species (or total of all species)
 *
 * @param allData
 * @param targetSpecies
 * @param outFile
 */
function drawSpeciesCallCountGraph(
	allData: DayRecord[],
	targetSpecies: string | null,
	outFile: string,
): void {
	const speciesDayCount: DatedCount[] = [];

	for (const dailyTotals of allData) {
		const { date, dayData } = dailyTotals;

		let count: number | null = null;
		if (dayData) {
			const speciesCount: BirdRecord[] = targetSpecies
				? dayData.filter((d) => d.bird === targetSpecies)
				: dayData;
			count = speciesCount.length > 0 ? speciesCount[0].count : 0;
		} else {
			count = null;
		}
		const dateRecord: DatedCount = {
			bird: targetSpecies || "All",
			date,
			count,
		};
		speciesDayCount.push(dateRecord);
	}

	const graph = new LineChart(
		800,
		600,
		speciesDayCount,
		targetSpecies || "All species",
	);
	graph.drawGraph();

	graph.writeToPng(outFile);

	console.log(`Wrote ${speciesDayCount.length} points to ${outFile}`);
}

/**
 * Draw graph of number of species heard, subject to optional minimum count
 *
 * @param allData
 * @param minCalls
 * @param outFile
 */
function drawNumSpeciesGraph(
	allData: DayRecord[],
	minCalls = 1,
	outFile: string,
): void {
	const speciesDayCount: DatedCount[] = [];

	for (const dailyTotals of allData) {
		const { date, dayData } = dailyTotals;

		let count: number | null = null;
		if (dayData) {
			const speciesCount: BirdRecord[] = dayData.filter(
				(d) => d.count >= minCalls,
			);
			count = speciesCount.length;
			// console.log(`${date}: ${count} species >= ${minCalls} calls`);
		} else {
			count = null;
		}
		const dateRecord: DatedCount = {
			bird: "Species count", // NB: slight hack of field usage here
			date,
			count,
		};
		speciesDayCount.push(dateRecord);
	}

	const graph = new LineChart(
		800,
		600,
		speciesDayCount,
		`Species count${minCalls > 1 ? ` ( >= ${minCalls} calls)` : " (No minimum)"}`,
	);
	graph.drawGraph();

	graph.writeToPng(outFile);

	console.log(`Wrote ${speciesDayCount.length} points to ${outFile}`);
}

/**
 * Generate a full output filename based on species name and count
 * @param species
 * @param speciesCount
 */
function outPathForSpecies(species: string, speciesCount: number): string {
	return `${__dirname}/../tmp/${species} (${speciesCount}).png`;
}

/**
 * Run script
 */
function main(): void {
	const target = process.argv[2];

	let minObservations = 10;
	let targetSpecies: string | null = null;
	if (target) {
		if (target.match(/^\d+$/)) {
			minObservations = parseInt(target, 10);
		} else {
			targetSpecies = target;
		}
	}

	const allData = loadCachedDailyData(rawDir);
	const aggregate = aggregateAllDays(allData, 1, minObservations);

	let drawSpecies: string[] = [];
	if (targetSpecies) {
		drawSpecies = [targetSpecies];
	} else {
		drawSpecies = aggregate.map((a) => a.bird);
	}

	// we want an ordered list of [ { bird: SPECIES, date: YYYY-MM-DD, count: number }]
	for (const species of drawSpecies) {
		const speciesCount = aggregate.find((a) => a.bird === species)?.count || 0;
		if (speciesCount >= 1) {
			const outFile = outPathForSpecies(species, speciesCount);
			drawSpeciesCallCountGraph(allData, species, outFile);
		}
	}
	let countAll = 0;
	// biome-ignore lint/suspicious: FIXME cleanup
	aggregate.forEach((a) => (countAll += a.count));
	drawSpeciesCallCountGraph(
		allData,
		null,
		outPathForSpecies("All species", countAll),
	);

	drawNumSpeciesGraph(
		allData,
		minObservations,
		outPathForSpecies("Num species", minObservations),
	);
}

main();
