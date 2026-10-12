# Bitcoin Vibes in a box.
#
#   docker compose -f contrib/vibes/docker-compose.yml up --build
#
# Everything the node needs to build and rewrite itself lives in here, so the
# host needs nothing but Docker. The console is published on 127.0.0.1:21212.
FROM debian:bookworm-slim AS build

RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential cmake ninja-build pkg-config git ca-certificates \
        libboost-dev libsqlite3-dev libcapnp-dev capnproto \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /vibes
COPY . .
RUN cmake -B build -G Ninja \
        -DBUILD_TESTS=OFF -DBUILD_BENCH=OFF -DBUILD_FUZZ_BINARY=OFF -DBUILD_GUI=OFF \
    && cmake --build build -j "$(nproc)"

# The runtime keeps the full toolchain: this node rewrites and rebuilds itself,
# so a slim runtime image would defeat the entire point.
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential cmake ninja-build pkg-config git ca-certificates curl \
        libboost-dev libsqlite3-dev libcapnp-dev capnproto python3 \
    && rm -rf /var/lib/apt/lists/*

# Nothing in this container runs as root: not the console, not the AI agent,
# not the node it builds.
RUN useradd --create-home --uid 1000 --shell /bin/sh vibes
USER vibes
ENV HOME=/home/vibes \
    PATH=/home/vibes/.local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin \
    # Keep every Claude Code file, credentials included, inside the one folder
    # that docker-compose.yml gives its own volume.
    CLAUDE_CONFIG_DIR=/home/vibes/.claude \
    # The container is the enclosure. Without this the console would look for
    # a second sandbox inside it, find none, and refuse to build before review.
    VIBES_SANDBOX=container

# Claude Code, from Anthropic's own installer: a script fetched over HTTPS and
# run at image build time, as the unprivileged user. That is trust placed in
# claude.ai. CLAUDE_CODE_VERSION picks what it installs ("stable" by default;
# pass a version number to pin one).
ARG CLAUDE_CODE_VERSION=stable
RUN curl -fsSL https://claude.ai/install.sh | bash -s -- "${CLAUDE_CODE_VERSION}"

# The source and its build output as shipped. On first start the entrypoint
# copies them into the working volume and starts a git history there, so saved
# experiments survive image rebuilds. See docker-entrypoint.sh.
COPY --from=build --chown=vibes:vibes /vibes /opt/vibes-image
RUN mkdir -p /home/vibes/work /home/vibes/.claude
WORKDIR /home/vibes/work

EXPOSE 21212
ENTRYPOINT ["sh", "/opt/vibes-image/contrib/vibes/docker-entrypoint.sh"]
