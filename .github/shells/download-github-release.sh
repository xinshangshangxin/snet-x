#!/usr/bin/env bash
set -o errexit
set -o pipefail
set -o nounset
# set -o xtrace

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

function command_exists() {
  command -v "$@" >/dev/null 2>&1
}

function download() {
  local repo=${1}
  local output_dir=${2}
  local ui_version=${3}

  local build_repo=${GITHUB_REPOSITORY:-''}
  local user=${build_repo%/*}

  local data=$(curl -u "${user}:${GITHUB_TOKEN:-}" -L -s https://api.github.com/repos/${repo}/releases/latest)
  local core_version=$(echo "${data}" | jq --raw-output '.tag_name')
  local download_url=$(echo "${data}" | jq --raw-output '.assets[] | {name: .name, downloadUrl: .browser_download_url }  | select(.name | test("darwin"; "i")) | .downloadUrl')

  echo "user: ${user}"
  echo "repo: ${repo}"
  echo "data: ${data}"
  echo "download_url: ${download_url}"
  echo "core_version: ${core_version}"
  echo "ui_version: ${ui_version}"
  echo "output_dir: ${output_dir}"

  rm -rf "${output_dir}/snet"
  wget -O "${output_dir}/snet" "${download_url}"

  echo "{\"core\": \"${core_version}\", \"ui\": \"${ui_version}\"}" >"${output_dir}/version.json"
}

function output_dir() {
  cd "${script_dir}"
  echo "$(cd "../../main/assets/" && pwd)"
}

function ui_version() {
  cd "${script_dir}"
  local package_dir="$(cd "../../" && pwd)"
  local ui_version=$(cat "${package_dir}/package.json" | jq --raw-output '.version')
  echo "${ui_version}"
}

if command_exists jq; then
  download "monsterxx03/snet" "$(output_dir)" "$(ui_version)"
else
  echo "no command jq found"
fi
