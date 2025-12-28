import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "https://app.birdweather.com/graphql",
  documents: ["lib/birdWeather/queries.ts"],
  generates: {
    "./lib/birdWeather/codegen/": {
      preset: "client",
    },
  },
};
export default config;
