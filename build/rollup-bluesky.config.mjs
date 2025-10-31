import typescript from "rollup-plugin-typescript2";
import copy from "rollup-plugin-copy";
import path from "path";
import { fileURLToPath } from "url";

const thisFile = fileURLToPath(import.meta.url);
const thisDir = path.dirname(thisFile);

const projectRootDir = path.dirname(thisDir);
const inputDir = projectRootDir;
const input = inputDir + "/lambdaAtproto.ts";
const outDir = projectRootDir + "/dist/bluesky";
const outputFile = outDir + "/lambda.js";

export default {
  plugins: [
    typescript({ tsconfigOverride: { compilerOptions: { module: "ES2020" } } }),
    copy({
      targets: [
        { src: inputDir + "/package.json", dest: outDir },
        { src: inputDir + "/package-lock.json", dest: outDir },
        { src: inputDir + "/.npmrc", dest: outDir },
        {
          src: inputDir + "/data/fonts/SourceSansPro-Regular.ttf",
          dest: outDir + "/data/fonts"
        }
      ]
    })
  ],
  input: input,
  output: {
    file: outputFile,
    format: "cjs"
  },
  external: ["fs", "luxon", "masto", "path"]
};
