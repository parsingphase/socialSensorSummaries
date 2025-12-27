import type { CodegenConfig } from '@graphql-codegen/cli'
 
const config: CodegenConfig = {
  schema: "https://app.birdweather.com/graphql",
  documents: ["graphql/**/queries.ts"],
  generates: {
    "./graphql/codegen/": {
      preset: "client",
    },
  },
};
export default config