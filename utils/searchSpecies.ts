#!/usr/bin/env npx tsx

// Search for a species in the BirdWeather DB,

import { Command } from "@commander-js/extra-typings";
import { initBirdWeatherClient } from "../lib/birdWeather/client";
import type {
	SearchSpeciesQuery,
	SearchSpeciesQueryVariables,
} from "../lib/birdWeather/codegen/graphql";
import { speciesSearchQuery } from "../lib/birdWeather/queries";

function getOpts() {
	const program = new Command()
		.argument(
			"searchQuery",
			"Common or Scientific name, or part thereof. Put multiple words in quotes.",
		)
		.description(
			`Search for a bird in the BirdWeather API, to get ID# for local scripts.
Note that only the first ${limit} hits are returned, so you may need to be more specific.`,
		);

	program.parse();

	return program.processedArgs;
}

const limit = 50;

function rPadSpace(value: string | number | null | undefined, length: number) {
	const valueString = value === null ? "" : `${value}`;
	const truncString = valueString.substring(0, length);
	return `${truncString}${" ".repeat(length - truncString.length)}`;
}

async function main() {
	const params = getOpts();

	const searchString = params.join(" ");

	if (!searchString.length) {
		throw new Error("Must include a search string on the command line");
	}

	const client = initBirdWeatherClient();

	const searchResults = await client.query<
		SearchSpeciesQuery,
		SearchSpeciesQueryVariables
	>({
		query: speciesSearchQuery,
		variables: { query: searchString, limit },
	});

	// console.log('Got results');

	const speciesList = (searchResults.data?.searchSpecies?.nodes || [])
		.filter((s) => !!s)
		.sort((a, b) =>
			a.commonName === b.commonName ? 0 : a.commonName > b.commonName ? 1 : -1,
		);

	if (speciesList) {
		const nameFieldLength = 30;
		console.log(
			[
				rPadSpace("ID", 8),
				rPadSpace("Common Name", nameFieldLength),
				rPadSpace("Scientific Name", nameFieldLength),
				rPadSpace("Alpha4", 8),
				rPadSpace("Alpha6", 8),
			].join(""),
		);
		for (const species of speciesList) {
			console.log(
				[
					rPadSpace(species.id, 8),
					rPadSpace(species.commonName, nameFieldLength),
					rPadSpace(species.scientificName, nameFieldLength),
					rPadSpace(species.alpha, 8),
					rPadSpace(species.alpha6, 8),
				].join(""),
			);
		}

		if (speciesList.length === limit) {
			console.warn(
				`Maximum of ${limit} hits returned, you may need a more specific query`,
			);
		}
	} else {
		console.error("No results returned");
	}
}

main()
	.catch((e) => console.error(e))
	.finally(() => console.error("Done"));
