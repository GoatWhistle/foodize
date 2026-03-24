SHELL := /bin/bash

.PHONY: help init uv-sync lint logs

help:
	@echo "Targets:"
	@echo "  init            - Install project dependencies"
	@echo "  uv-sync         - Install the package in editable mode"
	@echo "  up              - Start containers"

	@echo "  lint            - Run code linting with ruff"

init:
	python3 -m pip install -U pip uv;
	uv pip install -e .

uv-sync:
	uv pip install -e .

lint:
	uv pip install pre-commit
	pre-commit run --all-files
