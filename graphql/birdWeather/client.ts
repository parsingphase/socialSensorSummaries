import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";

/**
 * Get an ApolloClient pointing at the birdweather GQL API with default settings
 */
function initBirdWeatherClient(): ApolloClient {
  return new ApolloClient({
    link: new HttpLink({
      uri: "https://app.birdweather.com/graphql",
      fetch: (input, init): Promise<Response> => {
        console.log({ input, init });
        return fetch(input, init);
      },
      // print: (ast, originalPrint): string => {
      //   const printed = originalPrint(ast);
      //   console.log({printed});
      //   return printed;},
    }),
    cache: new InMemoryCache(),
  });
}
export { initBirdWeatherClient };
