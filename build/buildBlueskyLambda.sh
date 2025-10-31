#!/usr/bin/env bash

# This is impossibly slow if cdk.out is present (issues with tsc checking?) so clean that before running!

set -euo pipefail

get_script_dir () {
    SOURCE="${BASH_SOURCE[0]}"
    SOURCE_DIR=$( dirname "$SOURCE" )
    SOURCE_DIR=$(cd -P ${SOURCE_DIR} && pwd)
    echo ${SOURCE_DIR}
}

SCRIPT_DIR="$( get_script_dir )"

DIST_DIR="${SCRIPT_DIR}/../dist/bluesky"
BUILD_DIR="${SCRIPT_DIR}"
OUTPUT_DIR="${BUILD_DIR}/output"

#so slow… debug it…
set -x
cd "${SCRIPT_DIR}"
npx rollup -c rollup-bluesky.config.mjs
# rollup writes to DIST_DIR

## TODO scripts to copy root package.json without scripts / devDeps into build dir, apply fixes in docs/ISSUES.md if needed
# Then we can safely `npm install --omit=dev` in `dist`

rm -rf "${OUTPUT_DIR}/blueskyLambda.zip"

cd "${DIST_DIR}"
npm ci --omit=dev

rm -rf "${OUTPUT_DIR}/blueskyLambda.zip"
mkdir -p "${OUTPUT_DIR}"
zip -r "${OUTPUT_DIR}/blueskyLambda.zip" * > /dev/null

ls -lh "${OUTPUT_DIR}/blueskyLambda.zip"

echo DONE


