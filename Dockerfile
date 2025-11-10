# Build stage
FROM golang:1.23-alpine AS builder

WORKDIR /build

# Install build dependencies
RUN apk add --no-cache git

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build binaries
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o orbit .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o orbit-setup ./cmd/setup

# Runtime stage
FROM ubuntu:22.04

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    sudo \
    systemctl \
    apt-utils \
    ufw \
    iproute2 \
    procps \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy binaries from builder
COPY --from=builder /build/orbit /usr/local/bin/orbit
COPY --from=builder /build/orbit-setup /usr/local/bin/orbit-setup

# Create config directory
RUN mkdir -p /etc/orbit

# Expose default port
EXPOSE 3333

# Run Orbit
CMD ["/usr/local/bin/orbit", "--config", "/etc/orbit/config.json"]

