#!/usr/bin/env bash

set -euo pipefail

SCHEDULE_FILE=2023.csv
WATERMARK_FILE=watermark3.png

get_script_dir () {
    SOURCE="${BASH_SOURCE[0]}"
    SOURCE_DIR=$( dirname "$SOURCE" )
    SOURCE_DIR=$(cd -P ${SOURCE_DIR} && pwd)
    echo ${SOURCE_DIR}
}

SCRIPT_DIR="$( get_script_dir )"

SCHEDULE_DIR="${SCRIPT_DIR}/../potd_schedules"
DIST_DIR="${SCRIPT_DIR}/../dist"
DATA_DIR="${SCRIPT_DIR}/../data"
BUILD_DIR="${SCRIPT_DIR}"
OUTPUT_DIR="${BUILD_DIR}/output"

cd "${SCRIPT_DIR}"
rollup -c
# rollup writes to DIST_DIR

## TODO scripts to copy root package.json without scripts / devDeps into build dir, apply fixes in docs/ISSUES.md if needed
# Then we can safely `npm install --omit=dev` in `dist`

rm -rf "${OUTPUT_DIR}/lambda.zip"
mkdir -p "${DIST_DIR}/data/"
cp "${SCHEDULE_DIR}/${SCHEDULE_FILE}" "${DIST_DIR}/data/"
cp "${DATA_DIR}/${WATERMARK_FILE}" "${DIST_DIR}/data/watermark.png"
cd "${DIST_DIR}"
rm -rf "${OUTPUT_DIR}"
mkdir -p "${OUTPUT_DIR}"
zip -r "${OUTPUT_DIR}/lambda.zip" * > /dev/null

ls -lh "${OUTPUT_DIR}/lambda.zip"

echo DONE


