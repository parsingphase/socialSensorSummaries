import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";

/**
 * Get an ApolloClient pointing at the birdweather GQL API with default settings
 * @param apiUri
 */
function initBirdWeatherClient(
	apiUri = "https://app.birdweather.com/graphql",
): ApolloClient {
	return new ApolloClient({
		link: new HttpLink({
			uri: apiUri,
			// fetch: (input, init): Promise<Response> => {
			//   console.log({ input, init });
			//   return fetch(input, init);
			// },
		}),
		cache: new InMemoryCache(),
	});
}
export { initBirdWeatherClient };
