import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";

/**
 * Get an ApolloClient pointing at the birdweather GQL API with default settings
 */
function initBirdWeatherClient() {
  return new ApolloClient({
    link: new HttpLink({ uri: "https://app.birdweather.com/graphql" }),
    cache: new InMemoryCache(),
  });
}
export { initBirdWeatherClient };
