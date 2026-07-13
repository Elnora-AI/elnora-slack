#!/usr/bin/env python3
"""
Slack workspace auto-sync check - cross-platform, dependency-free.

Checks whether the generated workspace reference cache (workspace-users.md,
workspace-channels.md) is stale and prints a one-line reminder to run
/slack-sync. Runs on SessionStart. Never fails a session — any error degrades
to a soft notice.

Reference cache location (first match wins):
  1. $SLACK_REFERENCES_DIR
  2. $CLAUDE_PLUGIN_ROOT/references
  3. <this file>/../references
The *.template.md files that ship with the plugin are ignored — only the
generated (non-template) files count toward freshness.
"""

import os
import time
from pathlib import Path


def references_dir() -> Path:
    override = os.environ.get("SLACK_REFERENCES_DIR")
    if override:
        return Path(override)
    plugin_root = os.environ.get("CLAUDE_PLUGIN_ROOT")
    if plugin_root:
        return Path(plugin_root) / "references"
    return Path(__file__).parent.parent / "references"


def get_file_age_hours(file_path: Path) -> int:
    """Age in hours. 999 if the file doesn't exist, -1 on a filesystem error."""
    if not file_path.exists():
        return 999
    try:
        age_seconds = time.time() - file_path.stat().st_mtime
        return int(age_seconds / 3600)
    except OSError as e:
        import sys

        sys.stderr.write(f"Warning: could not stat {file_path}: {e}\n")
        return -1


def main():
    refs = references_dir()
    users_file = refs / "workspace-users.md"
    channels_file = refs / "workspace-channels.md"

    stale_threshold_hours = 24

    users_age = get_file_age_hours(users_file)
    channels_age = get_file_age_hours(channels_file)

    if users_age == -1 or channels_age == -1:
        print("Warning: could not check Slack workspace data freshness (filesystem error). Consider running /slack-sync.")
        return

    max_age = max(users_age, channels_age)

    if max_age >= 999:
        print("No Slack workspace reference cache yet. Run /slack-sync to fetch users and channels.")
    elif max_age > stale_threshold_hours:
        if max_age > 168:  # > 1 week
            print("Slack workspace data is over a week old. Run /slack-sync to refresh user and channel data.")
        elif max_age > 72:  # > 3 days
            print(f"Slack workspace data is {max_age} hours old. Consider running /slack-sync if working with Slack.")
        else:
            print(f"Slack workspace data last updated {max_age} hours ago.")
    else:
        print("")


if __name__ == "__main__":
    main()
