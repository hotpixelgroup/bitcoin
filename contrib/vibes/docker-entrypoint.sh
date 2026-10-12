#!/bin/sh
# Start the console inside the container.
#
# The working copy lives in a named volume (see docker-compose.yml), not in the
# image: saved experiments are git commits, and an image is thrown away every
# time it is rebuilt. On the first start the source and build output shipped in
# the image are copied into the volume and a git history is started there. On
# later starts whatever is in the volume is used as it is.
#
# Consequence, stated plainly: rebuilding the image does not update a volume
# that already holds a working copy, and the in-console updater has nothing to
# update from here (there is no origin remote). To move to a newer version,
# export your experiments (git format-patch), remove the volume, and start
# again.
set -eu

IMAGE=/opt/vibes-image
WORK="${VIBES_WORK:-$HOME/work}"

if [ ! -d "$WORK/.git" ]; then
  echo "First start: preparing the working copy in $WORK"
  cp -a "$IMAGE/." "$WORK/"
  git -C "$WORK" init -q -b vibes
  git -C "$WORK" add -A
  git -C "$WORK" -c user.name="Bitcoin Vibes" -c user.email="vibes@localhost" \
      commit -q -m "Bitcoin Vibes: the unmodified source shipped in this image"
fi

cd "$WORK"
# -u is load-bearing: without it Python buffers stdout and the ?key= link
# never reaches `docker logs`, leaving no way into the console.
exec python3 -u contrib/vibes/bitcoin-vibes --no-open --host 0.0.0.0 "$@"
