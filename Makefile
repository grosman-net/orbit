.PHONY: build install uninstall clean run dev

build:
	go build -o orbit -ldflags="-s -w" .
	go build -o orbit-setup -ldflags="-s -w" ./cmd/setup

install:
	sudo ./install.sh

uninstall:
	sudo ./uninstall.sh

clean:
	rm -f orbit orbit-setup

run: build
	./orbit --config config.json

dev:
	go run . --config config.json

setup:
	go run ./cmd/setup

# Build for multiple architectures
build-all:
	GOOS=linux GOARCH=amd64 go build -o orbit-linux-amd64 -ldflags="-s -w" .
	GOOS=linux GOARCH=arm64 go build -o orbit-linux-arm64 -ldflags="-s -w" .
	GOOS=linux GOARCH=arm go build -o orbit-linux-arm -ldflags="-s -w" .
	GOOS=linux GOARCH=amd64 go build -o orbit-setup-linux-amd64 -ldflags="-s -w" ./cmd/setup
	GOOS=linux GOARCH=arm64 go build -o orbit-setup-linux-arm64 -ldflags="-s -w" ./cmd/setup
	GOOS=linux GOARCH=arm go build -o orbit-setup-linux-arm -ldflags="-s -w" ./cmd/setup
