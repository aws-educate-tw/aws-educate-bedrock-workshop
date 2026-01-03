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

DEST_PREFIX="${S3_PREFIX%/}"
aws s3 sync "${SOURCE_DIR}" "s3://${BUCKET_NAME}/${DEST_PREFIX}/" --region "${REGION}"

echo "Deployed to: s3://${BUCKET_NAME}/${DEST_PREFIX}/"
