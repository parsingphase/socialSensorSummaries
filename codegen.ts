import type { CodegenConfig } from '@graphql-codegen/cli'
 
const config: CodegenConfig = {
  schema: "https://app.birdweather.com/graphql",
  documents: ["utils/**/*.ts"],
  generates: {
    "./codegen/gql/": {
      preset: "client",
    },
  },
};
export default config