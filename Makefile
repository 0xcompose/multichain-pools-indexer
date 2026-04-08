.PHONY: prepare rebuild-indexer run stop
prepare:
	pnpm install
	pnpm codegen

update-indexer:
	docker compose up -d --build --no-deps indexer

run: 
	docker compose build
	docker compose up -d

stop:
	docker compose down

logs:
	rtk docker compose logs