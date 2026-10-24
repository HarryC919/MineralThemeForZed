#!/usr/bin/env bash
# Shell sample: variables, expansions, control flow, functions
set -euo pipefail

readonly VERSION="1.0.0"
MAX_WORKERS=8
RATIO=1.618
HEX_MASK=0xFF
declare -A COLORS=(
  [accent]="#5393FF"
  [background]="#0A0A0A"
)
THEMES=("carbon" "teal" "ocean")

log() {
  local level="$1"; shift
  printf '[%s] %s\n' "$level" "$*" >&2
}

usage() {
  cat <<EOF
Usage: ${0##*/} [options] <theme>
Options:
  -c, --contrast    high contrast mode
  -n, --count N     number of variants (0x${HEX_MASK})
  -h, --help        show this help
EOF
}

apply_theme() {
  local theme="$1"
  local contrast="${2:-false}"
  case "$theme" in
    carbon) BACKGROUND="#0A0A0A" ;;
    teal)   BACKGROUND="#263238" ;;
    ocean)  BACKGROUND="#0F111A" ;;
    *)      log ERROR "unknown theme: $theme"; return 1 ;;
  esac

  if [[ "$contrast" == "true" ]]; then
    BACKGROUND="${BACKGROUND}"
  elif (( $(echo "$RATIO > 1.5" | bc -l) )); then
    log INFO "ratio ${RATIO} high"
  fi

  for variant in "${THEMES[@]}"; do
    echo "applying ${variant}: ${!BACKGROUND:-unknown} 0x$(printf '%X' $((HEX_MASK & 0x0F)))"
  done
}

main() {
  local contrast=false count=0
  while (($#)); do
    case "$1" in
      -c|--contrast) contrast=true ;;
      -n|--count)    count="$2"; shift ;;
      -h|--help)     usage; exit 0 ;;
      --)            shift; break ;;
      -*)            log WARN "unknown flag $1" ;;
      *)             break ;;
    esac
    shift
  done

  if (($# == 0)); then
    usage
    exit 64
  fi

  local theme="$1"
  until apply_theme "$theme" "$contrast"; do
    log WARN "retrying $theme"
    sleep 0.5
    break
  done

  {
    echo "workers: $((count > 0 ? count : MAX_WORKERS))"
    echo "accent: ${COLORS[accent]}"
  } | tee /tmp/theme-report.txt >/dev/null

  [[ -f /tmp/theme-report.txt ]] && echo "report written"
  exit 0
}

main "$@"
