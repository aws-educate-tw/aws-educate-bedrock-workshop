#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <s3-bucket> <s3-prefix> [region]" >&2
  exit 1
fi

S3_BUCKET="$1"
S3_PREFIX="$2"
REGION="${3:-${AWS_REGION:-${AWS_DEFAULT_REGION:-us-east-1}}}"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LAMBDA_DIR="${ROOT_DIR}/src/lambda"
BUILD_DIR="${ROOT_DIR}/.build"
ZIP_NAME="lambda.zip"

rm -rf "${BUILD_DIR}"
mkdir -p "${BUILD_DIR}"

rsync -a --delete \
  --exclude "node_modules" \
  --exclude ".DS_Store" \
  "${LAMBDA_DIR}/" "${BUILD_DIR}/"

pushd "${BUILD_DIR}" >/dev/null
npm ci --omit=dev
zip -qr "${ZIP_NAME}" .
popd >/dev/null

S3_KEY="${S3_PREFIX%/}/${ZIP_NAME}"
aws s3 cp "${BUILD_DIR}/${ZIP_NAME}" "s3://${S3_BUCKET}/${S3_KEY}" --region "${REGION}"

echo "Uploaded: s3://${S3_BUCKET}/${S3_KEY}"
