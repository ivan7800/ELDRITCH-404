#!/usr/bin/env sh
set -eu
game_dir=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)
exec xdg-open "$game_dir/ELDRITCH-404.html"
