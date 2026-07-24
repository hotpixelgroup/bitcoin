# Bitcoin Vibes in a box.
#
#   docker compose -f contrib/vibes/docker-compose.yml up
#
# Everything the node needs to build and rewrite itself lives in here, so the
# host needs nothing but Docker. The console is published on 127.0.0.1:21212.
FROM debian:bookworm-slim AS build

RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential cmake ninja-build pkg-config git ca-certificates \
        libboost-dev libcapnp-dev capnproto \
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
        libboost-dev libcapnp-dev capnproto python3 \
    && rm -rf /var/lib/apt/lists/* \
    && curl -fsSL https://claude.ai/install.sh | bash \
    && ln -sf /root/.local/bin/claude /usr/local/bin/claude

WORKDIR /vibes
COPY --from=build /vibes /vibes

# Git demands an identity before it will record a decree.
RUN git config --global user.email "vibes@localhost" \
    && git config --global user.name "Bitcoin Vibes" \
    && git config --global --add safe.directory /vibes

EXPOSE 21212
ENTRYPOINT ["python3", "contrib/vibes/bitcoin-vibes", "--no-open", "--host", "0.0.0.0"]
