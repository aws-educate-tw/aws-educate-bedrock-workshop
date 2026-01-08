#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <s3-bucket> <s3-prefix> [region]" >&2
  exit 1
fi

BUCKET_NAME="$1"
S3_PREFIX="$2"
REGION="${3:-${AWS_REGION:-${AWS_DEFAULT_REGION:-us-east-1}}}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

if ! command -v zip >/dev/null 2>&1; then
  echo "Missing 'zip' command. Install it before running this script." >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "Missing 'npm' command. Install it before running this script." >&2
  exit 1
fi

pushd "${ROOT_DIR}" >/dev/null
npm run build
popd >/dev/null

SOURCE_DIR="${ROOT_DIR}/dist"
if [[ ! -d "${SOURCE_DIR}" ]]; then
  echo "Build output not found: ${SOURCE_DIR}" >&2
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
