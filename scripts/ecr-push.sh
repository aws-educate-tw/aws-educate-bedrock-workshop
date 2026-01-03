#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <public-ecr-repo-name> <tag> [region]" >&2
  exit 1
fi

REPO_NAME="$1"
TAG="$2"
REGION="${3:-${AWS_REGION:-${AWS_DEFAULT_REGION:-us-east-1}}}"

if [[ -z "$REGION" ]]; then
  echo "Region is required. Provide as arg or set AWS_REGION/AWS_DEFAULT_REGION." >&2
  exit 1
fi

REGISTRY_URI="$(aws ecr-public describe-registries --query 'registries[0].registryUri' --output text --region "${REGION}")"
if [[ -z "$REGISTRY_URI" || "$REGISTRY_URI" == "None" ]]; then
  echo "Missing public ECR registry URI. Ensure your account has a public ECR registry." >&2
  exit 1
fi

IMAGE_URI="${REGISTRY_URI}/${REPO_NAME}:${TAG}"

if ! aws ecr-public describe-repositories --repository-names "${REPO_NAME}" --region "${REGION}" >/dev/null 2>&1; then
  aws ecr-public create-repository --repository-name "${REPO_NAME}" --region "${REGION}" >/dev/null
fi

aws ecr-public get-login-password --region "${REGION}" | \
  docker login --username AWS --password-stdin "public.ecr.aws"

docker build -f Dockerfile.lambda -t "${REPO_NAME}:${TAG}" .
docker tag "${REPO_NAME}:${TAG}" "${IMAGE_URI}"
docker push "${IMAGE_URI}"

echo "Pushed: ${IMAGE_URI}"
