.PHONY: setup build start dev lint

setup:
	pnpm install
	pnpm run setup

build:
	pnpm build

start:
	pnpm start

dev:
	pnpm dev

lint:
	pnpm lint

