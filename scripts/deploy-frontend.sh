#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 3 ]]; then
  echo "Usage: $0 <source-dir> <s3-bucket> <s3-prefix> [region]" >&2
  exit 1
fi

SOURCE_DIR="$1"
BUCKET_NAME="$2"
S3_PREFIX="$3"
REGION="${4:-${AWS_REGION:-${AWS_DEFAULT_REGION:-us-east-1}}}"

if [[ ! -d "${SOURCE_DIR}" ]]; then
  echo "Source directory not found: ${SOURCE_DIR}" >&2
  exit 1
fi

if ! command -v zip >/dev/null 2>&1; then
  echo "Missing 'zip' command. Install it before running this script." >&2
  exit 1
fi

DEST_PREFIX="${S3_PREFIX%/}"
ZIP_NAME="frontend.zip"
TMP_DIR="$(mktemp -d)"

pushd "${SOURCE_DIR}" >/dev/null
zip -qr "${TMP_DIR}/${ZIP_NAME}" .
popd >/dev/null

aws s3 cp "${TMP_DIR}/${ZIP_NAME}" "s3://${BUCKET_NAME}/${DEST_PREFIX}/${ZIP_NAME}" --region "${REGION}"
rm -rf "${TMP_DIR}"

echo "Deployed to: s3://${BUCKET_NAME}/${DEST_PREFIX}/${ZIP_NAME}"
