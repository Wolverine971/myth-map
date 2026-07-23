# scripts/run-daily-location-blog-creator.sh
set -euo pipefail

REPO_ROOT="/Users/djwayne/myth-map"
CLAUDE_BIN="/Users/djwayne/.local/bin/claude"
LOG_DIR="$REPO_ROOT/logs/blog-automation"

export TZ="America/New_York"
export PATH="/Users/djwayne/.local/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
# cron may omit HOME, which prevents Claude from finding ~/.claude credentials.
export HOME="/Users/djwayne"

TODAY="$(date +%Y-%m-%d)"
LOG_FILE="$LOG_DIR/cron-$TODAY.log"

if [[ "${1:-}" == "--check" ]]; then
	if [[ ! -d "$REPO_ROOT" ]]; then
		printf 'Missing repo root: %s\n' "$REPO_ROOT" >&2
		exit 1
	fi

	if [[ ! -x "$CLAUDE_BIN" ]]; then
		printf 'Claude binary is not executable: %s\n' "$CLAUDE_BIN" >&2
		exit 1
	fi

	if [[ ! -d "$LOG_DIR" ]]; then
		printf 'Missing log directory: %s\n' "$LOG_DIR" >&2
		exit 1
	fi

	auth_status="$("$CLAUDE_BIN" auth status 2>&1)" || {
		printf 'Claude authentication check failed\n' >&2
		exit 1
	}

	if [[ "$auth_status" != *'"loggedIn": true'* ]]; then
		printf 'Claude is not authenticated for cron\n' >&2
		exit 1
	fi

	printf 'Cron runner check passed\n'
	printf 'Repo: %s\n' "$REPO_ROOT"
	printf 'Claude: %s\n' "$CLAUDE_BIN"
	printf 'Claude auth: logged in\n'
	printf 'Log: %s\n' "$LOG_FILE"
	exit 0
fi

mkdir -p "$LOG_DIR"
cd "$REPO_ROOT"

{
	printf '\n[%s] Starting Tiny Tribe daily location blog creator\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
	set +e
	"$CLAUDE_BIN" --chrome --dangerously-skip-permissions -p "/daily-location-blog-creator"
	status=$?
	set -e
	printf '[%s] Finished with status %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$status"
	exit "$status"
} >> "$LOG_FILE" 2>&1
