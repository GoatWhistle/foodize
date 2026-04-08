SHELL := /bin/bash
SERVICE ?=
BACKEND_DIR := $(CURDIR)/src/backend
CERTS_DIR := $(BACKEND_DIR)/certs
.PHONY: help install lint build up down stop logs run

help:
	@echo "Targets:"
	@echo "  install         - Install project dependencies with Poetry"
	@echo "  lint            - Run code linting with ruff"
	@echo "  build           - Build docker containers (use SERVICE=... to build a specific service)"
	@echo "  up              - Start containers (use SERVICE=... to start a specific service)"
	@echo "  down            - Stop containers and remove them (use SERVICE=... to remove a specific service)"
	@echo "  stop            - Only stop running containers (use SERVICE=... to stop a specific service)"
	@echo "  run             - Run a command inside a container (requires SERVICE=...)"
	@echo "  logs            - View logs (use SERVICE=... and/or LOGS_TAIL=...)"
	@echo " "
	@echo "If SERVICE is not specified, the command applies to all containers"
	@echo "Use LOGS_TAIL=N to limit the number of log lines shown"

install:
	cd $(BACKEND_DIR) && pip install poetry && poetry install

generate-keys:
	@mkdir -p $(CERTS_DIR)
	@echo "Generating RSA keys..."
	openssl genrsa -out $(CERTS_DIR)/jwt-private.pem 2048
	openssl rsa -in $(CERTS_DIR)/jwt-private.pem -outform PEM -pubout -out $(CERTS_DIR)/jwt-public.pem
	@echo "Keys generated in $(CERTS_DIR)"

lint:
	cd $(BACKEND_DIR) && poetry run pre-commit run --all-files

build:
	@if [ -n "$(SERVICE)" ]; then \
		docker compose build $(SERVICE); \
	else \
		docker compose build; \
	fi

up:
	@if [ -n "$(SERVICE)" ]; then \
		docker compose up -d --remove-orphans $(SERVICE); \
	else \
		docker compose up -d --remove-orphans; \
	fi

down:
	@if [ -n "$(SERVICE)" ]; then \
		docker compose stop $(SERVICE) || true; \
		docker compose rm -f $(SERVICE) || true; \
	else \
		docker compose down; \
	fi

stop:
	@if [ -n "$(SERVICE)" ]; then \
		docker compose stop $(SERVICE); \
	else \
		docker compose stop; \
	fi

run:
	@if [ -z "$(SERVICE)" ]; then \
		echo "Error: SERVICE is not specified. Use SERVICE=app"; \
		exit 1; \
	fi
	docker compose run --rm $(SERVICE)

LOGS_TAIL ?=

logs:
	@if [ -n "$(SERVICE)" ] && [ -n "$(LOGS_TAIL)" ]; then \
		docker compose logs -f --tail=$(LOGS_TAIL) $(SERVICE); \
	elif [ -n "$(SERVICE)" ]; then \
		docker compose logs -f $(SERVICE); \
	elif [ -n "$(LOGS_TAIL)" ]; then \
		docker compose logs -f --tail=$(LOGS_TAIL); \
	else \
		docker compose logs -f; \
	fi