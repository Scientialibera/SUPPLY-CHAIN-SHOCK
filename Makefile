.PHONY: install run test no-emoji docker
install:
	python -m pip install -e ".[dev]"
run:
	uvicorn app.main:app --reload --port 8000
test:
	pytest -q
no-emoji:
	python scripts/check_no_emoji.py
docker:
	docker build -t supply-chain-shock .
