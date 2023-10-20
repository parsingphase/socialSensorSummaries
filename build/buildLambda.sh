#!/usr/bin/env bash

set -euo pipefail

get_script_dir () {
    SOURCE="${BASH_SOURCE[0]}"
    SOURCE_DIR=$( dirname "$SOURCE" )
    SOURCE_DIR=$(cd -P ${SOURCE_DIR} && pwd)
    echo ${SOURCE_DIR}
}

SCRIPT_DIR="$( get_script_dir )"

DIST_DIR="${SCRIPT_DIR}/../dist"
BUILD_DIR="${SCRIPT_DIR}"
OUTPUT_DIR="${BUILD_DIR}/output"

cd "${SCRIPT_DIR}"
rollup -c
# rollup writes to DIST_DIR

## TODO scripts to copy root package.json without scripts / devDeps into build dir, apply fixes in docs/ISSUES.md if needed
# Then we can safely `npm install --omit=dev` in `dist`

rm -rf "${OUTPUT_DIR}/lambda.zip"

cd "${DIST_DIR}"
npm ci --omit=dev

rm -rf "${OUTPUT_DIR}"
mkdir -p "${OUTPUT_DIR}"
zip -r "${OUTPUT_DIR}/lambda.zip" * > /dev/null

ls -lh "${OUTPUT_DIR}/lambda.zip"

echo DONE


